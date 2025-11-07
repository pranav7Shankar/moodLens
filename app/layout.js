import "@/styles/globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata = {
  title: "MoodLens - AI-Powered Facial Recognition and Emotion Detection",
  description: "AI-Powered Facial Recognition and Emotion Detection System for HR Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

