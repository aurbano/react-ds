import React from 'react';
import { Box, Point, Projection } from './types';
import getOffset from './util/getOffset';

export type SelectionProps = {
  disabled?: boolean;
  confineSelectionBox?: boolean;
  target: HTMLElement;
  onSelectionChange?: (elements: Array<number>) => void;
  onHighlightChange?: (elements: Array<number>) => void;
  elements: Array<HTMLElement>;
  offset?: {
    top: number;
    left: number;
  };
  style?: React.CSSProperties;
  zoom?: number;
  ignoreTargets?: Array<string>;
};

type SelectionState = {
  mouseDown: boolean;
  startPoint: Point | null;
  endPoint: Point | null;
  selectionBox: Box | null;
  offset: {
    top: number;
    left: number;
  };
  zoom: number;
};

export default class Selection extends React.PureComponent<SelectionProps, SelectionState> {
  selectedChildren: Array<number>;
  highlightedChildren: Array<number>;

  constructor(props: SelectionProps) {
    super(props);

    this.state = {
      mouseDown: false,
      startPoint: null,
      endPoint: null,
      selectionBox: null,
      offset: getOffset(props),
      zoom: props.zoom || 1,
    };

    this.selectedChildren = [];
    this.highlightedChildren = [];
  }

  static getDerivedStateFromProps(nextProps: SelectionProps) {
    return {
      offset: getOffset(nextProps),
    };
  }

  componentDidMount() {
    this.reset();
    this.bind();
  }

  componentDidUpdate() {
    this.reset();
    this.bind();
    if (this.state.mouseDown && this.state.selectionBox) {
      this.updateCollidingChildren(this.state.selectionBox);
    }
  }

  componentWillUnmount() {
    this.reset();
    window.document.removeEventListener('mousemove', this.onMouseMove);
    window.document.removeEventListener('mouseup', this.onMouseUp);
  }

  bind = () => {
    this.props.target.addEventListener('mousedown', this.onMouseDown);
    this.props.target.addEventListener('touchstart', this.onTouchStart);
  };

  reset = () => {
    if (this.props.target) {
      this.props.target.removeEventListener('mousedown', this.onMouseDown);
    }
  };

  init = (e: Event, x: number, y: number): boolean => {
    if (this.props.ignoreTargets) {
      const Target = e.target as Element;

      if (Target && !Target.matches) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyTarget = Target as any;
        // polyfill matches
        const defaultMatches = (s: string) =>
          [].indexOf.call(window.document.querySelectorAll(s), this as never) !== -1;

        Target.matches =
          anyTarget.matchesSelector ||
          anyTarget.mozMatchesSelector ||
          anyTarget.msMatchesSelector ||
          anyTarget.oMatchesSelector ||
          anyTarget.webkitMatchesSelector ||
          defaultMatches;
      }
      if (Target.matches && Target.matches(this.props.ignoreTargets.join(','))) {
        return false;
      }
    }
    const nextState: SelectionState = {
      ...this.state,
    };

    nextState.mouseDown = true;
    nextState.startPoint = {
      x: (x - this.state.offset.left) / this.state.zoom,
      y: (y - this.state.offset.top) / this.state.zoom,
    };

    this.setState(nextState);
    return true;
  };

  /**
   * On root element mouse down
   * The event should be a MouseEvent | TouchEvent, but flow won't get it...
   * @private
   */
  onMouseDown = (e: MouseEvent) => {
    // sometimes onMouseDown will fire on touch events
    const touchEvent = e as unknown as React.SyntheticEvent;

    if (
      this.props.disabled ||
      e.button === 2 ||
      (touchEvent.nativeEvent && (touchEvent.nativeEvent as MouseEvent).which === 2)
    ) {
      return;
    }

    if (this.init(e, e.pageX, e.pageY)) {
      window.document.addEventListener('mousemove', this.onMouseMove);
      window.document.addEventListener('mouseup', this.onMouseUp);
    }
  };

  onTouchStart = (e: TouchEvent) => {
    if (this.props.disabled || !e.touches || !e.touches[0] || e.touches.length > 1) {
      return;
    }

    if (this.init(e, e.touches[0].pageX, e.touches[0].pageY)) {
      window.document.addEventListener('touchmove', this.onTouchMove);
      window.document.addEventListener('touchend', this.onMouseUp);
    }
  };

  /**
   * On document element mouse up
   * @private
   */
  onMouseUp = () => {
    window.document.removeEventListener('touchmove', this.onTouchMove);
    window.document.removeEventListener('mousemove', this.onMouseMove);
    window.document.removeEventListener('mouseup', this.onMouseUp);
    window.document.removeEventListener('touchend', this.onMouseUp);

    this.setState({
      mouseDown: false,
      startPoint: null,
      endPoint: null,
      selectionBox: null,
    });

    if (this.props.onSelectionChange) {
      this.props.onSelectionChange(this.selectedChildren);
    }

    if (this.props.onHighlightChange) {
      this.highlightedChildren = [];
      this.props.onHighlightChange(this.highlightedChildren);
    }
    this.selectedChildren = [];
  };

  /**
   * On document element mouse move
   * @private
   */
  onMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    if (this.state.mouseDown) {
      const endPoint: Point = {
        x: (e.pageX - this.state.offset.left) / this.state.zoom,
        y: (e.pageY - this.state.offset.top) / this.state.zoom,
      };

      this.setState({
        endPoint,
        selectionBox: this.calculateSelectionBox(this.state.startPoint, endPoint),
      });
    }
  };

  onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (this.state.mouseDown) {
      const endPoint: Point = {
        x: (e.touches[0].pageX - this.state.offset.left) / this.state.zoom,
        y: (e.touches[0].pageY - this.state.offset.top) / this.state.zoom,
      };

      this.setState({
        endPoint,
        selectionBox: this.calculateSelectionBox(this.state.startPoint, endPoint),
      });
    }
  };

  /**
   * Calculate if two segments overlap in 1D
   * @param lineA [min, max]
   * @param lineB [min, max]
   */
  lineIntersects = (lineA: [number, number], lineB: [number, number]): boolean =>
    lineA[1] >= lineB[0] && lineB[1] >= lineA[0];

  /**
   * Detect 2D box intersection - the two boxes will intersect
   * if their projections to both axis overlap
   * @private
   */
  boxIntersects = (boxA: Box, boxB: Box): boolean => {
    // calculate coordinates of all points
    const boxAProjection: Projection = {
      x: [boxA.left, boxA.left + boxA.width],
      y: [boxA.top, boxA.top + boxA.height],
    };

    const boxBProjection: Projection = {
      x: [boxB.left, boxB.left + boxB.width],
      y: [boxB.top, boxB.top + boxB.height],
    };

    return (
      this.lineIntersects(boxAProjection.x, boxBProjection.x) &&
      this.lineIntersects(boxAProjection.y, boxBProjection.y)
    );
  };

  /**
   * Updates the selected items based on the
   * collisions with selectionBox,
   * also updates the highlighted items if they have changed
   * @private
   */
  updateCollidingChildren = (selectionBox: Box) => {
    this.selectedChildren = [];

    if (this.props.elements) {
      this.props.elements.forEach((ref, $index) => {
        if (ref) {
          const refBox = ref.getBoundingClientRect();
          const tmpBox = {
            top: (refBox.top - this.state.offset.top + window.scrollY) / this.state.zoom,
            left: (refBox.left - this.state.offset.left + window.scrollX) / this.state.zoom,
            width: ref.clientWidth,
            height: ref.clientHeight,
          };

          if (this.boxIntersects(selectionBox, tmpBox)) {
            this.selectedChildren.push($index);
          }
        }
      });
    }

    if (
      this.props.onHighlightChange &&
      JSON.stringify(this.highlightedChildren) !== JSON.stringify(this.selectedChildren)
    ) {
      const { onHighlightChange } = this.props;
      this.highlightedChildren = [...this.selectedChildren];
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(() => {
          onHighlightChange(this.highlightedChildren);
        });
      } else {
        onHighlightChange(this.highlightedChildren);
      }
    }
  };

  /**
   * Calculate selection box dimensions
   * @private
   */
  calculateSelectionBox = (startPoint: Point | null, endPoint: Point | null) => {
    if (!this.state.mouseDown || !startPoint || !endPoint) {
      return null;
    }

    let left,
      top,
      width,
      height = 0;

    // The extra 1 pixel is to ensure that the mouse is on top
    // of the selection box and avoids triggering clicks on the target.
    const boundingMarginPx = 1;

    if (this.props.confineSelectionBox) {
      const refBox = this.props.target.getBoundingClientRect();

      left = Math.max(0, Math.min(startPoint.x, endPoint.x)) - boundingMarginPx;
      top = Math.max(0, Math.min(startPoint.y, endPoint.y)) - boundingMarginPx;
      width =
        (startPoint.x < endPoint.x
          ? Math.min(refBox.width - startPoint.x, Math.abs(startPoint.x - endPoint.x))
          : Math.min(startPoint.x, Math.abs(startPoint.x - endPoint.x))) + boundingMarginPx;
      height =
        (startPoint.y < endPoint.y
          ? Math.min(refBox.height - startPoint.y, Math.abs(startPoint.y - endPoint.y))
          : Math.min(startPoint.y, Math.abs(startPoint.y - endPoint.y))) + boundingMarginPx;
    } else {
      left = Math.min(startPoint.x, endPoint.x) - boundingMarginPx;
      top = Math.min(startPoint.y, endPoint.y) - boundingMarginPx;
      width = Math.abs(startPoint.x - endPoint.x) + boundingMarginPx;
      height = Math.abs(startPoint.y - endPoint.y) + boundingMarginPx;
    }

    return {
      left,
      top,
      width,
      height,
    };
  };

  /**
   * Render
   */
  render() {
    let style: React.CSSProperties = {
      position: 'absolute',
      background: 'rgba(159, 217, 255, 0.3)',
      border: 'solid 1px rgba(123, 123, 123, 0.61)',
      zIndex: 9,
      cursor: 'crosshair',
      ...this.props.style,
    };

    if (this.state.selectionBox) {
      style = {
        ...style,
        ...this.state.selectionBox,
      };
    }

    if (!this.state.mouseDown || !this.state.endPoint || !this.state.startPoint) {
      return null;
    }
    return <div className="react-ds-border" style={style} />;
  }
}
