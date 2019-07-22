// @flow

import React from 'react';
import PropTypes from 'prop-types';

export type Point = {
  x: number,
  y: number,
}

export type Box = {
  left: number,
  top: number,
  width: number,
  height: number,
}

type Props = {
  disabled?: boolean,
  target: HTMLElement,
  onSelectionChange(elements: Array<any>): void,
  onHighlightChange(elements: Array<any>): void,
  elements: Array<HTMLElement>,
  // eslint-disable-next-line react/no-unused-prop-types
  offset?: {
    // eslint-disable-next-line react/no-unused-prop-types
    top: number,
    // eslint-disable-next-line react/no-unused-prop-types
    left: number,
  },
  style?: any,
  zoom?: number,
  ignoreTargets?: Array<string>,
};

type State = {
  mouseDown: boolean,
  startPoint: ?Point,
  endPoint: ?Point,
  selectionBox: ?Box,
  offset: {
    top: number,
    left: number,
  },
};

function getOffset(props: Props) {
  let offset = {
    top: 0,
    left: 0,
  };
  if (props.offset) {
    offset = {
      ...props.offset,
    };
  } else if (props.target) {
    const boundingBox = props.target.getBoundingClientRect();
    offset.top = boundingBox.top + window.scrollY;
    offset.left = boundingBox.left + window.scrollX;
  }
  return offset;
}

export default class Selection extends React.PureComponent<Props, State> { // eslint-disable-line react/prefer-stateless-function
  props: Props;
  state: State;
  selectedChildren: Array<number>;
  highlightedChildren: Array<number>;

  constructor(props: Props) {
    super(props);

    this.state = {
      mouseDown: false,
      startPoint: null,
      endPoint: null,
      selectionBox: null,
      offset: getOffset(props),
    };

    this.selectedChildren = [];
    this.highlightedChildren = [];
  }

  componentDidMount() {
    this.reset();
    this.bind();
  }

  componentWillReceiveProps(nextProps: Props) {
    this.setState({
      offset: getOffset(nextProps),
    });
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
      const Target = (e.target: any);
      if (!Target.matches) {
        // polyfill matches
        const defaultMatches = (s: string) => (
          [].indexOf.call(window.document.querySelectorAll(s), this) !== -1
        );
        Target.matches =
          Target.matchesSelector ||
          Target.mozMatchesSelector ||
          Target.msMatchesSelector ||
          Target.oMatchesSelector ||
          Target.webkitMatchesSelector ||
          defaultMatches;
      }
      if (Target.matches && Target.matches(this.props.ignoreTargets.join(','))) {
        return false;
      }
    }
    const nextState = {};

    const zoom = this.props.zoom || 1;

    nextState.mouseDown = true;
    nextState.startPoint = {
      x: (x * zoom) - this.state.offset.left,
      y: (y * zoom) - this.state.offset.top,
    };

    this.setState(nextState);
    return true;
  };

  /**
   * On root element mouse down
   * The event should be a MouseEvent | TouchEvent, but flow won't get it...
   * @private
   */
  onMouseDown = (e: MouseEvent | any) => {
    if (this.props.disabled || e.button === 2 || (e.nativeEvent && e.nativeEvent.which === 2)) {
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

    this.props.onSelectionChange(this.selectedChildren);
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
        x: e.pageX - this.state.offset.left,
        y: e.pageY - this.state.offset.top,
      };

      this.setState({
        endPoint,
        selectionBox: this.calculateSelectionBox(
          this.state.startPoint,
          endPoint
        ),
      });
    }
  };

  onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (this.state.mouseDown) {
      const endPoint: Point = {
        x: e.touches[0].pageX - this.state.offset.left,
        y: e.touches[0].pageY - this.state.offset.top,
      };

      this.setState({
        endPoint,
        selectionBox: this.calculateSelectionBox(
          this.state.startPoint,
          endPoint
        ),
      });
    }
  };

  /**
   * Calculate if two segments overlap in 1D
   * @param lineA [min, max]
   * @param lineB [min, max]
   */
  lineIntersects = (lineA: [number, number], lineB: [number, number]): boolean => (
    lineA[1] >= lineB[0] && lineB[1] >= lineA[0]
  );

  /**
   * Detect 2D box intersection - the two boxes will intersect
   * if their projections to both axis overlap
   * @private
   */
  boxIntersects = (boxA: Box, boxB: Box): boolean => {
    // calculate coordinates of all points
    const boxAProjection = {
      x: [boxA.left, boxA.left + boxA.width],
      y: [boxA.top, boxA.top + boxA.height],
    };

    const boxBProjection = {
      x: [boxB.left, boxB.left + boxB.width],
      y: [boxB.top, boxB.top + boxB.height],
    };

    return this.lineIntersects(boxAProjection.x, boxBProjection.x) &&
           this.lineIntersects(boxAProjection.y, boxBProjection.y);
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
            top: (refBox.top - this.state.offset.top) + window.scrollY,
            left: (refBox.left - this.state.offset.left) + window.scrollX,
            width: ref.clientWidth,
            height: ref.clientHeight,
          };

          if (this.boxIntersects(selectionBox, tmpBox)) {
            this.selectedChildren.push($index);
          }
        }
      });
    }
    if (this.props.onHighlightChange && JSON.stringify(this.highlightedChildren) !== JSON.stringify(this.selectedChildren)) {
      this.highlightedChildren = [...this.selectedChildren];
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(() => {
          this.props.onHighlightChange(this.highlightedChildren);
        });
      } else {
        this.props.onHighlightChange(this.highlightedChildren);
      }
    }
  };

  /**
   * Calculate selection box dimensions
   * @private
   */
  calculateSelectionBox = (startPoint: ?Point, endPoint: ?Point) => {
    if (!this.state.mouseDown || !startPoint || !endPoint) {
      return null;
    }

    // The extra 1 pixel is to ensure that the mouse is on top
    // of the selection box and avoids triggering clicks on the target.
    const left = Math.min(startPoint.x, endPoint.x) - 1;
    const top = Math.min(startPoint.y, endPoint.y) - 1;
    const width = Math.abs(startPoint.x - endPoint.x) + 1;
    const height = Math.abs(startPoint.y - endPoint.y) + 1;

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
    const style = {
      position: 'absolute',
      background: 'rgba(159, 217, 255, 0.3)',
      border: 'solid 1px rgba(123, 123, 123, 0.61)',
      zIndex: 9,
      cursor: 'crosshair',
      ...this.state.selectionBox,
      ...this.props.style,
    };
    if (!this.state.mouseDown || !this.state.endPoint || !this.state.startPoint) {
      return null;
    }
    return (
      <div className='react-ds-border' style={ style } />
    );
  }
}

Selection.propTypes = {
  target: PropTypes.object,
  disabled: PropTypes.bool,
  onSelectionChange: PropTypes.func.isRequired,
  onHighlightChange: PropTypes.func,
  elements: PropTypes.array.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  offset: PropTypes.object,
  zoom: PropTypes.number,
  style: PropTypes.object,
  ignoreTargets: PropTypes.array,
};
