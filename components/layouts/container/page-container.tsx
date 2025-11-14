"use client";

import Head from "next/head";
import { ReactNode } from "react";

export type PageContainerProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

const PageContainer = ({ title, description, children }: PageContainerProps) => (
  <>
    {title && (
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
      </Head>
    )}
    <div>{children}</div>
  </>
);

export default PageContainer;

