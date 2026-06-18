let _title   = '';
let _content = '';

export function setTextModal(title: string, content: string) {
  _title   = title;
  _content = content;
}

export function getTextModal() {
  return { title: _title, content: _content };
}
