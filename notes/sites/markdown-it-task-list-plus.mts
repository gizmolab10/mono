// Custom markdown-it plugin to support [+] checkbox syntax
// Transforms [+] at start of list items into orange checkbox with "?"

export default function taskListPlusPlugin(md) {
  // Add a rule to transform [+] in list items
  md.core.ruler.after('inline', 'task-list-plus', (state) => {
    const tokens = state.tokens;
    
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'inline') continue;
      if (!tokens[i].children) continue;
      
      const children = tokens[i].children;
      if (children.length === 0) continue;
      
      // Check if first child is text starting with [+]
      const firstChild = children[0];
      if (firstChild.type === 'text' && firstChild.content.startsWith('[+] ')) {
        // Remove [+] from text
        firstChild.content = firstChild.content.slice(4);
        
        // Create checkbox token
        const checkboxToken = new state.Token('html_inline', '', 0);
        checkboxToken.content = '<input type="checkbox" class="checkbox-plus" disabled> ';
        
        // Insert at beginning
        children.unshift(checkboxToken);
        
        // Mark parent list item
        for (let j = i - 1; j >= 0; j--) {
          if (tokens[j].type === 'list_item_open') {
            tokens[j].attrJoin('class', 'task-list-item');
            break;
          }
          if (tokens[j].type === 'bullet_list_open' || tokens[j].type === 'ordered_list_open') {
            break;
          }
        }
      }
    }
  });
}
