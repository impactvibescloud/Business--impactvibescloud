import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
];
export default function ReactrichTextEditor() {
  const [content, setContent] = useState("");
  const handleContentChange = (content, delta, source, editor) => {
    setContent(editor.getHTML());
  };
  // const wrapperRef = useCallback((wrapper) => {
  //   if (wrapper == null) return;
  //   wrapper.innerHTML = "";
  //   const editor = document.createElement("div");
  //   wrapper.append(editor);
  //   new Quill(editor, { theme: "snow", modules: { toolbar: TOOLBAR_OPTIONS } });
  // }, []);
  // return <div className="container" ref={wrapperRef}></div>;
  return (
    <ReactQuill
      theme="snow"
      value={content}
      onChange={handleContentChange}
      modules={{ toolbar: TOOLBAR_OPTIONS }}
    />
  );
}
