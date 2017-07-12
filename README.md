# React DS
> Tiny (7KB) React Drag-to-Select component (with no dependencies! with support for touch devices!

[![Travis](https://img.shields.io/travis/aurbano/react-ds.svg)](https://travis-ci.org/aurbano/react-ds)
[![npm](https://img.shields.io/npm/v/react-ds.svg)](https://www.npmjs.com/package/react-ds)
[![Coverage Status](https://coveralls.io/repos/github/aurbano/react-ds/badge.svg?branch=master)](https://coveralls.io/github/aurbano/react-ds?branch=master)
[![npm](https://img.shields.io/npm/dm/react-ds.svg)](https://www.npmjs.com/package/react-ds)
[![npm](https://img.shields.io/npm/l/react-ds.svg)](https://www.npmjs.com/package/react-ds)
[![Codacy grade](https://img.shields.io/codacy/grade/e2589a609bdc4c56bd49c232a65dab4e.svg)](https://www.codacy.com/app/aurbano/react-ds)

[video here]

## Installation

```console
$ npm i react-ds
```
Or if you prefer yarn
```console
$ yarn add react-ds
```

## Usage

```js
import Selection from 'react-ds'

class MyComponent extends React.PureComponent {
  
  constructor() {
    super();
    
    // Store a ref to each selectable element
    this.elRefs = [];
    
    this.state = {
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
      return {
        background: 'blue',
      };
    }
    return {};
  };
  
  render() {
    const selectableElements = [
      'one',
      'another',
      'hey there',
      'last'
    ];
    return (
      <div ref={ (ref) => { this.ref = ref; } }>
        { selectableElements.map((el, index) => (
          <div
            key={ el }
            ref={ (ref) => { this.elRefs.push(ref); } }
            style={ this.getStyle(index) }
          >
            { el }
          </div>
        )) }
        <Selection
            target={ this.ref}
            elements={ this.elRefs }
            offset={ 0 }
            onSelectionChange={ this.handleSelection }
        />
      </div>
    );
  }
}
```
