import React from 'react';
import { shallow, mount } from 'enzyme';
import clone from 'lodash/clone';

import Selection from '../src/index';

const mockTarget = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const defaultProps = {
  target: mockTarget,
  disabled: false,
  onSelectionChange: () => {},
  elements: [],
  offset: {
    top: 0,
    left: 0,
  },
  zoom: 1,
};

const initialState = {
  mouseDown: false,
  startPoint: null,
  endPoint: null,
  selectionBox: null,
  offset: defaultProps.offset,
  zoom: defaultProps.zoom,
};

describe('<Selection />', () => {
  it('Should not render when not selecting', () => {
    const props = defaultProps;

    const renderedComponent = shallow(
      <Selection { ...props } />
    );
    expect(renderedComponent.find('div.selection')).toHaveLength(0);
  });

  it('onMouseDown: Should start tracking', () => {
    const mouseEvent = {
      pageX: 100,
      pageY: 400,
      button: 1,
      nativeEvent: {
        which: 1,
      },
    };

    mockTarget.addEventListener.mockClear();
    mockTarget.removeEventListener.mockClear();

    const renderedComponent = shallow(
      <Selection { ...defaultProps } />
    );
    expect(renderedComponent.state()).toEqual(initialState);

    renderedComponent.instance().onMouseDown(mouseEvent);

    const mouseDownState = clone(initialState);
    mouseDownState.startPoint = {
      x: mouseEvent.pageX,
      y: mouseEvent.pageY,
    };
    mouseDownState.mouseDown = true;

    expect(renderedComponent.state()).toEqual(mouseDownState);
  });

  it('onMouseUp: Should stop tracking', () => {
    const mouseEvent = {
      pageX: 100,
      pageY: 400,
      button: 1,
      nativeEvent: {
        which: 1,
      },
    };

    mockTarget.addEventListener.mockClear();
    mockTarget.removeEventListener.mockClear();

    const renderedComponent = shallow(
      <Selection { ...defaultProps } />
    );

    renderedComponent.instance().onMouseDown(mouseEvent);
    renderedComponent.instance().onMouseUp();

    expect(renderedComponent.state()).toEqual(initialState);
  });

  it('onMouseMove: Should update selection box', () => {
    const mouseEvent = {
      pageX: 100,
      pageY: 400,
      button: 1,
      nativeEvent: {
        which: 1,
      },
    };

    mockTarget.addEventListener.mockClear();
    mockTarget.removeEventListener.mockClear();

    const moveEvent = clone(mouseEvent);
    moveEvent.pageX = -400;
    moveEvent.pageY = -100;
    moveEvent.preventDefault = jest.fn();

    // Using mount because we need the selectionBox ref to exist
    const renderedComponent = mount(
      <Selection { ...defaultProps } />
    );

    renderedComponent.instance().onMouseDown(mouseEvent);
    renderedComponent.instance().onMouseMove(moveEvent);

    const moveState = clone(initialState);
    moveState.endPoint = {
      x: moveEvent.pageX,
      y: moveEvent.pageY,
    };
    moveState.mouseDown = true;
    moveState.selectionBox = {
      height: Math.abs(moveEvent.pageX) + mouseEvent.pageX + 1,
      width: Math.abs(moveEvent.pageY) + mouseEvent.pageY + 1,
      left: moveEvent.pageX - 1,
      top: moveEvent.pageY - 1,
    };
    moveState.startPoint = {
      x: mouseEvent.pageX,
      y: mouseEvent.pageY,
    };

    expect(renderedComponent.state()).toEqual(moveState);
  });

  it('boxIntersects: Calculates box intersections', () => {
    const renderedComponent = shallow(
      <Selection { ...defaultProps } />
    );

    const boxOne = {
      left: 0,
      top: 0,
      width: 10,
      height: 10,
    };

    const boxTwo = {
      left: -5,
      top: 0,
      width: 10,
      height: 10,
    };

    const boxThree = {
      left: 40,
      top: 10,
      width: 10,
      height: 10,
    };

    expect(renderedComponent.instance().boxIntersects(boxOne, boxTwo)).toBeTruthy();
    expect(renderedComponent.instance().boxIntersects(boxOne, boxThree)).toBeFalsy();
  });

  it('updateCollidingChildren: Updates colliding children', () => {
    const props = clone(defaultProps);
    const refs = [];

    const elementBoxes = [
      {
        top: 0,
        left: 0,
        width: 10,
        height: 10,
      },
      {
        top: 100,
        left: 300,
        width: 10,
        height: 10,
      },
    ];

    // render the elements to get boxes for them
    mount(
      <div>
        { elementBoxes.map((box, $index) => (
          <div ref={ (element) => { refs.push(element); } } key={ $index } style={ { position: 'absolute', ...box } } />
        )) }
      </div>
    );

    props.elements = refs;

    const renderedComponent = shallow(
      <Selection { ...props } />
    );

    const box = {
      left: -50,
      top: -50,
      width: 100,
      height: 100,
    };

    renderedComponent.instance().updateCollidingChildren(box);

    expect(renderedComponent.instance().selectedChildren).toEqual([0, 1]);
  });
});
