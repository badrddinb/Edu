"use client";

import dynamic from "next/dynamic";

// The app keeps the teacher's settings and exams in the browser, so it renders
// on the client only.
const App = dynamic(() => import("./App"), { ssr: false });

export default function AppLoader() {
  return <App />;
}
