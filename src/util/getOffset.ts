import { SelectionProps } from '..';

function getOffset({ offset, target }: SelectionProps) {
  let newOffset = {
    top: 0,
    left: 0,
  };

  if (offset) {
    newOffset = {
      ...offset,
    };
  } else if (target) {
    const boundingBox = target.getBoundingClientRect();
    newOffset.top = boundingBox.top + window.scrollY;
    newOffset.left = boundingBox.left + window.scrollX;
  }

  return newOffset;
}

export default getOffset;
