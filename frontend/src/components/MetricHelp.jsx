import React, { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function MetricHelp({ title, body, faqId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <span className="metric-help-wrap" ref={ref}>
      <button
        type="button"
        className="metric-help-btn"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label={"Help: " + title}
        title={"Learn more about " + title}
      >
        <HelpCircle size={13} />
      </button>

      {open && (
        <div className="metric-tooltip" role="tooltip">
          <div className="metric-tooltip-title">{title}</div>
          <div className="metric-tooltip-body">{body}</div>
          {faqId && (
            <Link
              to="/faq"
              className="metric-tooltip-link"
              onClick={() => setOpen(false)}
            >
              Full explanation
            </Link>
          )}
        </div>
      )}
    </span>
  );
}
