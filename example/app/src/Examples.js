import React from 'react';
import Example from './Example';

export default class Examples extends React.PureComponent {

  render() {
    return (
      <div>
        <h2>Example</h2>

        <p>The box below is the <code>target</code> for the Selection component. You'll see that you can't initiate selections outside of it.</p>

        <Example />

        <h2 style={ { marginTop: '2em' } }>Custom styles</h2>

        <p>Here's an example using custom styles for the selection box. These are simply passed on the <code>style</code> prop of the <code>Selection</code> component.</p>

        <Example style={ { background: 'rgba(0,0,0,0.3)' } } />
      </div>
    );
  }
}