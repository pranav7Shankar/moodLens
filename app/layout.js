import "@/styles/globals.css";

export const metadata = {
  title: "Mood Lens",
  description: "AI-Powered Facial Recognition and Emotion Detection System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

