"use client";

import { ReactNode } from "react";

export type PageContainerProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

const PageContainer = ({ title, children }: PageContainerProps) => (
  <div>
    {children}
  </div>
);

export default PageContainer;

