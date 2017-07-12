# React DS
> Tiny (7KB) React Drag-to-Select component (with no dependencies! with support for touch devices!

[![Travis](https://img.shields.io/travis/aurbano/react-ds.svg)](https://travis-ci.org/aurbano/react-ds)
[![npm](https://img.shields.io/npm/v/react-ds.svg)](https://www.npmjs.com/package/react-ds)
[![Coverage Status](https://coveralls.io/repos/github/aurbano/react-ds/badge.svg?branch=master)](https://coveralls.io/github/aurbano/react-ds?branch=master)
[![npm](https://img.shields.io/npm/dm/react-ds.svg)](https://www.npmjs.com/package/react-ds)
[![npm](https://img.shields.io/npm/l/react-ds.svg)](https://www.npmjs.com/package/react-ds)
[![Codacy grade](https://img.shields.io/codacy/grade/e2589a609bdc4c56bd49c232a65dab4e.svg)](https://www.codacy.com/app/aurbano/react-ds)

[![react-ds gif](https://thumbs.gfycat.com/FatYellowKid-size_restricted.gif)](https://gfycat.com/gifs/detail/fatyellowkid)

## Installation

```console
$ npm i react-ds
```
Or if you prefer yarn
```console
$ yarn add react-ds
```

## Usage

```jsx
<Selection
    target={ ref}
    elements={ refs[] }
    offset={ 0 }
    onSelectionChange={ this.handleSelection }
/>
```

### Props

Docs on each prop, see them in action in the example below.

#### `target`

Element where the selection should be applied to. This is to scope the mouse/touch event handlers and make sure that it doesn't affect your whole web app.

It must be a React `ref`, it should also exist, so you may want to check if it's already initialized before rendering the `Selection` component.

#### `elements`

Array of refs to the elements that are selectable. The `Selection` component will use this to get their location and sizes to determine whether they are within the selection area.

The should exist before rendering the `Selection` component.

#### `offset`

If the `target` element is rendered with a different parent than the `Selection` component, or it has an offset, then you can specify it here so that the `Selection` area is rendered in the right place.

Typically passing the result of `target.getBoundingClientRect()` does the trick.

#### `onSelectionChange`

Function that will be executed when the selection changes. An array of element indexes will be passed (with the same indexes as the `elements` prop).

This is where you probably want to update your state, to highlight them as selected for example.

## Example

This example was taken from [`example/app/src/Example.js`](https://github.com/aurbano/react-ds/blob/master/example/app/src/Example.js) which you can see running at https://aurbano.eu/react-ds/

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import Selection from 'react-ds';

export default class Example extends React.PureComponent {

  constructor() {
    super();

    this.state = {
      ref: null,
      elRefs: [],
      selectedElements: [], // track the elements that are selected
    };
  }

  handleSelection = (indexes) => {
    this.setState({
      selectedElements: indexes,
    });
  };

  getStyle = (index) => {
    if (this.state.selectedElements.indexOf(index) > -1) {
      // Selected state
      return {
        background: '#2185d0',
        borderColor: '#2185d0',
        color: 'white',
      };
    }
    return {};
  };

  addElementRef = (ref) => {
    const elRefs = this.state.elRefs;
    elRefs.push(ref);
    this.setState({
      elRefs,
    });
  };

  renderSelection() {
    if (!this.state.ref || !this.state.elRefs) {
      return null;
    }
    return (
      <Selection
        target={ this.state.ref}
        elements={ this.state.elRefs }
        offset={ this.state.ref.getBoundingClientRect() }
        onSelectionChange={ this.handleSelection }
        style={ this.props.style }
      />
    );
  }

  render() {
    const selectableElements = [
      'one',
      'another',
      'hey there',
      'item',
      'two',
      'three',
      'something longer?',
      'last'
    ];
    return (
      <div ref={ (ref) => { this.setState({ ref }); } } className='item-container'>
        { selectableElements.map((el, index) => (
          <div
            key={ el }
            ref={ this.addElementRef }
            style={ this.getStyle(index) }
            className='item'
          >
            { el }
          </div>
        )) }
        { this.renderSelection() }
      </div>
    );
  }
}

Example.PropTypes = {
  style: PropTypes.object,
};
```

## Contributing

Only edit the files in the `src` folder. I'll update `dist` manually before publishing new versions to npm.

To run the tests simply run `npm test`. Add tests as you see fit to the `test` folder, they must be called `{string}.test.js`.

## Meta

Copyright &copy; [Alejandro U. Alvarez](https:/aurbano.eu) 2017. MIT Licensed.