import Operation from '../base';
import { BlockDeleteOperation, BlockInsertOperation } from '../blocks';
import {TextInsertOperation} from './index';

export class TextDeleteOperation extends Operation {
  public static TYPE = 'text/delete';
  public needForceUpdate = true;
  public mergeable = true;

  constructor(value: string, block: number, input: number, nodes: number[], startOffset: number, endOffset: number) {
    super({
      type: TextDeleteOperation.TYPE,
      block,
      input,
      nodes,
      startOffset,
      endOffset,
      data: {
        value,
      },
    });
  }

  public transform(operation: Operation): Operation {
    const newOp = this.clone();

    switch (operation.type) {
      case BlockInsertOperation.TYPE:
        if (operation.block <= newOp.block) {
          newOp.block++;
        }
        break;

      case BlockDeleteOperation.TYPE:
        if (operation.block <= newOp.block) {
          newOp.block--;
        }
        break;

      case TextInsertOperation.TYPE:
        if (operation.startOffset <= newOp.startOffset) {
          const length = operation.endOffset - operation.startOffset;

          newOp.startOffset += length;
          newOp.endOffset += length;
        }
        break;

      case TextDeleteOperation.TYPE:
        if (operation.startOffset <= newOp.startOffset) {
          const length = operation.endOffset - operation.startOffset;

          newOp.startOffset -= length;
          newOp.endOffset -= length;
        }
    }

    return newOp;
  }

  public reverse(): Operation {
    const op = new TextInsertOperation(
      this.data.value,
      this.block,
      this.input,
      this.nodes,
      this.startOffset,
      this.endOffset,
    );

    op.reversed = true;
    return op;
  }

  public merge(operation: TextDeleteOperation): boolean {
    if (this.block !== operation.block) {
      return false;
    }

    if (this.input !== operation.input) {
      return false;
    }

    if (this.nodes.length !== operation.nodes.length) {
      return false;
    }

    if (!this.nodes.every((e, i) => operation.nodes[i] === e)) {
      return false;
    }

    if (this.startOffset !== operation.endOffset) {
      return false;
    }

    this.data.value =  operation.data.value + this.data.value;
    this.startOffset = operation.startOffset;

    return true;
  }
}