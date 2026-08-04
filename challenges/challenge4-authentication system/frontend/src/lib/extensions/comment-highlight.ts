import { Mark, mergeAttributes } from '@tiptap/core';

export interface CommentHighlightOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    commentHighlight: {
      setCommentHighlight: (commentId: string) => ReturnType;
      unsetCommentHighlight: (commentId?: string) => ReturnType;
    };
  }
}

export const CommentHighlight = Mark.create<CommentHighlightOptions>({
  name: 'commentHighlight',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) {
            return {};
          }
          return {
            'data-comment-id': attributes.commentId,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'comment-highlight bg-yellow-100 border-l-2 border-yellow-400 cursor-pointer hover:bg-yellow-200 transition-colors',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCommentHighlight:
        (commentId: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { commentId });
        },
      unsetCommentHighlight:
        (commentId?: string) =>
        ({ commands, state }) => {
          if (commentId) {
            // Remove specific comment highlight
            const { from, to } = state.selection;
            const marks = state.doc.nodesBetween(from, to, (node, pos) => {
              if (node.isInline) {
                return node.marks.filter(
                  mark => mark.type.name === this.name && mark.attrs.commentId === commentId
                );
              }
            });
            
            if (marks) {
              return commands.unsetMark(this.name);
            }
            return false;
          }
          
          return commands.unsetMark(this.name);
        },
    };
  },
});