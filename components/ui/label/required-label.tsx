import React from "react";

type RequiredLabelProps = {
  label?: string;
  style?: React.CSSProperties;
  asteriskStyle?: React.CSSProperties;
  className?: string;
};

function RequiredLabel({
  label = "",
  style,
  asteriskStyle,
  className,
}: RequiredLabelProps) {
  const baseStyle: React.CSSProperties = { fontSize: 14 };
  const baseAsterisk: React.CSSProperties = { color: "red", fontSize: 14 };

  return (
    <span style={{ ...baseStyle, ...style }} className={className}>
      {label}{" "}
      <span style={{ ...baseAsterisk, ...asteriskStyle }}>*</span>
    </span>
  );
}

export default RequiredLabel;

