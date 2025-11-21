// Minimal local Stub tool for Editor.js to handle unknown blocks.
// Provides a simple textarea to view/edit block data as JSON.
export default class Stub {
  data: any;
  api: any;

  constructor({ data, api }: { data: any; api: any }) {
    this.data = data || {};
    this.api = api;
  }

  static get toolbox() {
    return {
      title: 'Stub',
      icon:
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    };
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.style.padding = '8px 0';

    const textarea = document.createElement('textarea');
    textarea.value = JSON.stringify(this.data, null, 2);
    textarea.style.width = '100%';
    textarea.style.minHeight = '80px';
    textarea.style.boxSizing = 'border-box';
    textarea.style.fontFamily = 'monospace';
    textarea.style.fontSize = '13px';

    textarea.addEventListener('input', () => {
      try {
        this.data = JSON.parse(textarea.value);
      } catch (e) {
        // ignore JSON errors while typing
      }
    });

    wrapper.appendChild(textarea);

    return wrapper;
  }

  save() {
    return this.data || {};
  }
}
