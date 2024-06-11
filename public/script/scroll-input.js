const textarea = document.getElementById("my-textarea");
const maxLines = 10;
let numLines = 0;
textarea.addEventListener("input", () => {
  const newlineCount = (textarea.value.match(/\n/g) || []).length;
  if (newlineCount >= maxLines) {
    textarea.value = textarea.value.slice(0, -1);
    return;
  }
  numLines = newlineCount + 1;
  textarea.style.height = "auto";
  textarea.rows = numLines;
});

textarea.addEventListener("keydown", function(e) {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = this.selectionStart;
    const end = this.selectionEnd;

    // insert tab character
    this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);

    // set cursor position after inserted tab character
    this.selectionStart = this.selectionEnd = start + 1;
  }
});