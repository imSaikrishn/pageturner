# Page-Turner

A browser-based PDF learning application that turns study material into structured learning sessions with quizzes, progress tracking, and experience points (XP).

## Overview

Page-Turner allows users to upload a PDF, read its pages in the browser, and answer quizzes associated with learning levels. Users earn XP for completing quizzes and can track their learning progress through a simple dashboard.

The application is built with HTML, CSS, and JavaScript. PDF rendering is handled by PDF.js, while account and progress data are stored locally in the browser.

## Features

- **User registration and login** using browser-based storage.
- **PDF upload and viewing** with PDF.js.
- **Page navigation** with previous-page and next-page controls.
- **Learning levels** created from the uploaded PDF.
- **Interactive quizzes** with multiple-choice, true/false, and fill-in-the-blank questions.
- **Progress tracking** for XP, completed levels, and quiz accuracy.
- **Level progression** based on quiz performance.
- **Responsive dark-themed interface** for desktop and smaller screens.

## Technology Stack

| Technology | Purpose |
| --- | --- |
| HTML5 | Application structure |
| CSS3 | Styling and responsive layout |
| JavaScript | Application logic and interactivity |
| PDF.js | PDF document rendering |
| localStorage | Local account and progress persistence |

## Project Structure

```text
Page-Turner/
├── index.html
├── styles.css
├── app.js
└── README.md
```

## Getting Started

### Prerequisites

- A modern web browser.
- An internet connection to load the PDF.js library from the CDN referenced in `index.html`.
- A local development server is recommended.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/<your-username>/<your-repository>.git
   ```

2. Open the project directory:

   ```bash
   cd <your-repository>
   ```

3. Open the project using Visual Studio Code or another editor.

4. Run the application using a local development server, such as the **Live Server** extension in Visual Studio Code.

5. Open the local address provided by the development server in your browser.

You can also open `index.html` directly in a browser, although using a local server is recommended.

## Usage

1. Register with a username and password.
2. Log in to Page-Turner.
3. Select a PDF file and upload it.
4. Read the PDF using the page navigation controls.
5. Start the quiz for the current learning level.
6. Answer all questions and submit the quiz.
7. Earn XP and unlock the next level by achieving the required quiz score.
8. View your learning statistics in the progress section.

## Current Implementation

The following details describe the current codebase:

- A maximum of five learning levels is created from the uploaded PDF.
- Each level currently represents one page.
- Quiz questions are predefined in `app.js`; they are not automatically generated from PDF content.
- The existing question sets are written for sample IT and cloud-security topics. They should be updated to match other study documents.
- User accounts and progress are stored in the browser's `localStorage`.
- Data is local to the browser and is not synchronized across devices.

## Security and Data Limitations

Page-Turner is a front-end project and does not currently implement production-grade authentication.

- Passwords are stored in browser `localStorage` without secure password hashing.
- Do not use real, sensitive, or reused passwords.
- Clearing the browser's site data may delete saved accounts and progress.
- There is no server-side account system or cloud backup.

Uploaded PDFs are read by the browser. The current application does not send them to a Page-Turner backend.

## Contributing

Contributions, bug reports, and feature suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the application in a browser.
5. Submit a pull request describing your changes.

## License

No license has been specified for this project yet. Add a `LICENSE` file before granting permissions for reuse or redistribution.

---

**Page-Turner** — Read. Learn. Progress.
