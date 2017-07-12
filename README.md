# React DS
> Tiny (7KB) React Drag-to-Select component (with no dependencies! with support for touch devices!

[video here]

## Installation

```console
npm i react-ds
// or
yarn add react-ds
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