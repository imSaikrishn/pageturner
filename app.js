document.addEventListener("DOMContentLoaded", () => {
  // Initialize users from localStorage
  let users = JSON.parse(localStorage.getItem('users') || '{}');
  let currentUser = null;
  let pdfDoc = null;
  let totalPages = 0;
  let currentPage = 1;
  let levels = [];
  let currentLevel = 1;
  let quizQuestions = [];
  let currentQuestionIndex = 0;
  let userAnswers = {};
  
  console.log('Initial users:', users);

  // UI Elements
  const loginScreen = document.getElementById('login-screen');
  const mainApp = document.getElementById('main-app');
  const loginMessage = document.getElementById('login-message');
  const currentUserEl = document.getElementById('current-user');

  // Buttons
  const btnLogin = document.getElementById('btn-login');
  const btnRegister = document.getElementById('btn-register');
  const btnLogout = document.getElementById('btn-logout');
  const btnUpload = document.getElementById('btn-upload');
  const btnPrevPage = document.getElementById('btn-prev-page');
  const btnNextPage = document.getElementById('btn-next-page');
  const btnStartQuiz = document.getElementById('btn-start-quiz');
  const btnPrevQuestion = document.getElementById('btn-prev-question');
  const btnNextQuestion = document.getElementById('btn-next-question');
  const btnSubmitQuiz = document.getElementById('btn-submit-quiz');
  const btnGoHome = document.getElementById('btn-go-home'); // New button

  // PDF Elements
  const pdfCanvas = document.getElementById('pdf-canvas');
  const pdfFileInput = document.getElementById('pdf-file');
  const pageInfo = document.getElementById('page-info');

  // Quiz Elements
  const quizQuestionsEl = document.getElementById('quiz-questions');
  const quizTitle = document.getElementById('quiz-title');
  const progressText = document.getElementById('progress-text');
  const quizProgress = document.getElementById('quiz-progress');

  // ---- AUTHENTICATION ----
  btnRegister.addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if(!username || !password) {
      showLoginMessage('Please enter both username and password', 'error');
      return;
    }
    
    if(users[username]) {
      showLoginMessage('Username already exists!', 'error');
      return;
    }
    
    // Register new user
    users[username] = {
      password: password,
      xp: 0,
      completedLevels: [],
      correctAnswers: 0,
      totalQuestions: 0
    };
    
    localStorage.setItem('users', JSON.stringify(users));
    showLoginMessage('Registration successful! Please login.', 'success');
    document.getElementById('password').value = '';
  });

  btnLogin.addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!users[username]) {
      showLoginMessage('User not found. Please register first.', 'error');
      return;
    }
    
    if (users[username].password !== password) {
      showLoginMessage('Incorrect password', 'error');
      return;
    }
    
    // SUCCESSFUL LOGIN
    currentUser = username;
    currentUserEl.textContent = username;
    
    loginScreen.style.display = 'none';
    mainApp.classList.remove('hidden');
    updateProfile();
    
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    
    showMessage(`Welcome, ${username}!`);
  });

  btnLogout.addEventListener('click', () => {
    currentUser = null;
    mainApp.classList.add('hidden');
    loginScreen.style.display = 'flex';
    showLoginMessage('You have been logged out', 'info');
  });

  // ---- PDF UPLOAD ----
  btnUpload.addEventListener('click', handlePdfUpload);
  pdfFileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      handlePdfUpload();
    }
  });

  function handlePdfUpload() {
    const file = pdfFileInput.files[0];
    
    if(!file) {
      showMessage('Please select a PDF file first', 'error');
      return;
    }
    
    if (file.type !== 'application/pdf') {
      showMessage('Please select a PDF file', 'error');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const pdfData = new Uint8Array(e.target.result);
        
        pdfjsLib.getDocument(pdfData).promise.then(function(doc) {
          pdfDoc = doc;
          totalPages = doc.numPages;
          
          showMessage(`PDF loaded successfully! ${totalPages} pages detected.`, 'success');
          
          initLevels(totalPages);
          
          document.getElementById('upload-section').classList.add('hidden');
          document.getElementById('study-section').classList.remove('hidden');
          
          currentPage = 1;
          renderPage(currentPage);
          
        }).catch(function(error) {
          showMessage('Error loading PDF: ' + error.message, 'error');
        });
        
      } catch (error) {
        showMessage('Error processing PDF file', 'error');
      }
    };
    
    reader.onerror = function() {
      showMessage('Error reading PDF file', 'error');
    };
    
    reader.readAsArrayBuffer(file);
  }

  // ---- PDF RENDERING ----
  function renderPage(pageNum) {
    if (!pdfDoc) return;
    
    pdfDoc.getPage(pageNum).then(function(page) {
      const viewport = page.getViewport({ scale: 1.3 });
      const context = pdfCanvas.getContext('2d');
      
      pdfCanvas.height = viewport.height;
      pdfCanvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      page.render(renderContext).promise.then(function() {
        pageInfo.textContent = `Page ${pageNum} of ${totalPages}`;
      });
      
    }).catch(function(error) {
      showMessage('Error displaying PDF page', 'error');
    });
  }

  // ---- PAGE NAVIGATION ----
  btnPrevPage.addEventListener('click', function() {
    if (currentPage > 1) {
      currentPage--;
      renderPage(currentPage);
    } else {
      showMessage('This is the first page', 'info');
    }
  });

  btnNextPage.addEventListener('click', function() {
    if (currentPage < totalPages) {
      currentPage++;
      renderPage(currentPage);
    } else {
      showMessage('This is the last page', 'info');
    }
  });

  // ---- LEVEL SYSTEM ----
  function initLevels(totalPages) {
    levels = [];
    const totalLevels = Math.min(5, totalPages);
    
    for(let i = 0; i < totalLevels; i++) {
      levels.push({
        id: i + 1,
        startPage: i + 1,
        endPage: i + 1,
        pageRange: `Page ${i + 1}`,
        unlocked: i === 0,
        completed: false
      });
    }
    
    renderLevels();
  }

  function renderLevels() {
    const levelsList = document.getElementById('levels-list');
    levelsList.innerHTML = '';
    
    levels.forEach(level => {
      const card = document.createElement('div');
      card.className = `level-card ${level.completed ? 'completed' : level.unlocked ? 'unlocked' : 'locked'}`;
      
      card.innerHTML = `
        <h3>Level ${level.id}</h3>
        <p>${level.pageRange}</p>
        ${level.completed ? '<span class="completed-badge">✓ Completed</span>' : ''}
      `;
      
      if(level.unlocked && !level.completed) {
        card.addEventListener('click', () => startLevel(level.id));
      }
      
      levelsList.appendChild(card);
    });
    
    document.getElementById('levels-section').classList.remove('hidden');
    
    // Check if all levels are completed
    checkAllLevelsCompleted();
  }

  function startLevel(levelId) {
    currentLevel = levelId;
    const level = levels[levelId - 1];
    
    document.getElementById('levels-section').classList.add('hidden');
    document.getElementById('study-section').classList.remove('hidden');
    
    currentPage = level.startPage;
    renderPage(currentPage);
    
    showMessage(`Starting Level ${levelId}. Study the content then take the quiz!`);
  }

  // ---- QUIZ SYSTEM ----
  btnStartQuiz.addEventListener('click', function() {
    if (!pdfDoc) {
      showMessage('No PDF loaded', 'error');
      return;
    }
    
    generateQuizQuestions(currentLevel);
    document.getElementById('study-section').classList.add('hidden');
    document.getElementById('quiz-section').classList.remove('hidden');
    
    startQuiz();
  });

 // Generate specific questions for each level based on actual PDF content
function generateQuizQuestions(levelId) {
  switch(levelId) {
    case 1: // Page 1 - ITIL & Security Basics
      quizQuestions = [
        {
          question: "Which ITIL lifecycle phase involves creating detailed plans for new IT services?",
          type: "mcq",
          options: [
            "Service Strategy",
            "Service Design", 
            "Service Transition",
            "Service Operation"
          ],
          answer: "Service Design"
        },
        {
          question: "True or False: Patch Management involves regularly updating systems to fix vulnerabilities.",
          type: "truefalse", 
          options: ["True", "False"],
          answer: "True"
        },
        {
          question: "Data protection methods in cloud computing include encryption, key management, and ______ control.",
          type: "fill",
          answer: "access"
        }
      ];
      break;

    case 2: // Page 2 - Cloud Models & IAM
      quizQuestions = [
        {
          question: "What model categorizes cloud services into SaaS, PaaS, and IaaS?",
          type: "mcq",
          options: [
            "OSI Model",
            "SPI Model", 
            "TCP/IP Model",
            "Cloud Framework"
          ],
          answer: "SPI Model"
        },
        {
          question: "True or False: IAM stands for Identity and Access Management.",
          type: "truefalse", 
          options: ["True", "False"],
          answer: "True"
        },
        {
          question: "The ______ Responsibility Model defines security duties between cloud providers and customers.",
          type: "fill",
          answer: "Shared"
        }
      ];
      break;

    case 3: // Page 3 - Security Management & Vulnerabilities
      quizQuestions = [
        {
          question: "What is the first step in applying security management standards in the cloud?",
          type: "mcq",
          options: [
            "Apply encryption",
            "Identify & assess cloud services", 
            "Conduct security audits",
            "Implement firewalls"
          ],
          answer: "Identify & assess cloud services"
        },
        {
          question: "True or False: Vulnerability management involves detecting weak points in systems.",
          type: "truefalse", 
          options: ["True", "False"],
          answer: "True"
        },
        {
          question: "IAM involves Identification, Authentication, and ______.",
          type: "fill",
          answer: "Authorization"
        }
      ];
      break;

    case 4: // Page 4 - ITIL Lifecycle & SPI Models
      quizQuestions = [
        {
          question: "Which ITIL stage involves building and testing services before live deployment?",
          type: "mcq",
          options: [
            "Service Strategy",
            "Service Design", 
            "Service Transition",
            "Service Operation"
          ],
          answer: "Service Transition"
        },
        {
          question: "True or False: In SaaS, the customer is responsible for securing the underlying infrastructure.",
          type: "truefalse", 
          options: ["True", "False"],
          answer: "False"
        },
        {
          question: "PaaS security requires secure ______ practices to reduce vulnerabilities.",
          type: "fill",
          answer: "development"
        }
      ];
      break;

    case 5: // Page 5 - Advanced Security & Protocols
      quizQuestions = [
        {
          question: "Which protocol is used for Single Sign-On (SSO) environments?",
          type: "mcq",
          options: [
            "LDAP",
            "SAML", 
            "OpenID",
            "OAuth"
          ],
          answer: "SAML"
        },
        {
          question: "True or False: Availability management in IaaS is solely the provider's responsibility.",
          type: "truefalse", 
          options: ["True", "False"],
          answer: "False"
        },
        {
          question: "______ management ensures cloud infrastructure remains accessible and operational.",
          type: "fill",
          answer: "Availability"
        }
      ];
      break;

    default:
      // Fallback questions if levelId doesn't match
      quizQuestions = [
        {
          question: `What is the main topic discussed on page ${levelId}?`,
          type: "mcq",
          options: [
            "Security Concepts",
            "Networking", 
            "Cloud Services",
            "All of the above"
          ],
          answer: "Security Concepts"
        },
        {
          question: `True or False: The content emphasizes cloud security importance.`,
          type: "truefalse", 
          options: ["True", "False"],
          answer: "True"
        },
        {
          question: `Cloud security requires proper ______ controls.`,
          type: "fill",
          answer: "access"
        }
      ];
  }
}

  function startQuiz() {
    currentQuestionIndex = 0;
    userAnswers = {};
    
    quizTitle.textContent = `Level ${currentLevel} Quiz`;
    displayQuestion(currentQuestionIndex);
    
    showMessage(`Quiz started! Answer all questions to complete Level ${currentLevel}.`);
  }

  function displayQuestion(questionIndex) {
    quizQuestionsEl.innerHTML = '';
    
    const question = quizQuestions[questionIndex];
    progressText.textContent = `Question ${questionIndex + 1} of ${quizQuestions.length}`;
    quizProgress.style.width = `${((questionIndex + 1) / quizQuestions.length) * 100}%`;
    
    const questionEl = document.createElement('div');
    questionEl.className = 'quiz-question';
    questionEl.innerHTML = `<h3>Question ${questionIndex + 1}</h3><p>${question.question}</p>`;
    
    if (question.type === 'mcq' || question.type === 'truefalse') {
      question.options.forEach((option, optIndex) => {
        const optionEl = document.createElement('label');
        optionEl.className = 'option';
        optionEl.innerHTML = `
          <input type="radio" name="quizQuestion" value="${option}"> 
          <span>${String.fromCharCode(65 + optIndex)}. ${option}</span>
        `;
        
        optionEl.addEventListener('click', function() {
          questionEl.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
          this.classList.add('selected');
          this.querySelector('input').checked = true;
          userAnswers[questionIndex] = option;
        });
        
        questionEl.appendChild(optionEl);
      });
    } 
    else if (question.type === 'fill') {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'fillAnswer';
      input.placeholder = 'Type your answer here...';
      input.className = 'auth-input';
      input.style.marginTop = '10px';
      input.style.width = '100%';
      
      input.addEventListener('input', function() {
        userAnswers[questionIndex] = this.value;
      });
      
      questionEl.appendChild(input);
    }
    
    quizQuestionsEl.appendChild(questionEl);
    
    // Update navigation buttons
    btnPrevQuestion.classList.toggle('hidden', questionIndex === 0);
    btnNextQuestion.classList.toggle('hidden', questionIndex === quizQuestions.length - 1);
    btnSubmitQuiz.classList.toggle('hidden', questionIndex !== quizQuestions.length - 1);
  }

  btnPrevQuestion.addEventListener('click', function() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      displayQuestion(currentQuestionIndex);
    }
  });

  btnNextQuestion.addEventListener('click', function() {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      currentQuestionIndex++;
      displayQuestion(currentQuestionIndex);
    }
  });

  btnSubmitQuiz.addEventListener('click', function() {
    // Check if all questions are answered
    if (Object.keys(userAnswers).length < quizQuestions.length) {
      showMessage('Please answer all questions before submitting', 'error');
      return;
    }
    
    // Calculate score
    let score = 0;
    quizQuestions.forEach((question, index) => {
      if (userAnswers[index] && userAnswers[index].toString().toLowerCase().trim() === question.answer.toLowerCase().trim()) {
        score++;
      }
    });
    
    // Calculate XP
    const performance = score / quizQuestions.length;
    let xpEarned = 0;
    
    if (performance >= 0.8) {
      xpEarned = 25;
      showMessage(`Excellent! You scored ${score}/${quizQuestions.length}. +25 XP`, 'success');
    } else if (performance >= 0.6) {
      xpEarned = 15;
      showMessage(`Good job! You scored ${score}/${quizQuestions.length}. +15 XP`, 'success');
    } else {
      xpEarned = 10;
      showMessage(`You scored ${score}/${quizQuestions.length}. +10 XP`, 'info');
    }
    
    // Update user stats
    addXP(xpEarned);
    users[currentUser].correctAnswers += score;
    users[currentUser].totalQuestions += quizQuestions.length;
    
    // Mark level as completed if score is good enough
    if (performance >= 0.6) {
      completeLevel(currentLevel);
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // Return to levels section
    setTimeout(() => {
      document.getElementById('quiz-section').classList.add('hidden');
      document.getElementById('levels-section').classList.remove('hidden');
      updateProfile();
    }, 3000);
  });

  function completeLevel(levelId) {
    if (!users[currentUser].completedLevels.includes(levelId)) {
      users[currentUser].completedLevels.push(levelId);
    }
    
    levels[levelId - 1].completed = true;
    
    // Unlock next level
    if (levelId < levels.length) {
      levels[levelId].unlocked = true;
    }
    
    renderLevels();
    showMessage(`Level ${levelId} completed! ${levelId < levels.length ? 'Next level unlocked!' : 'All levels completed!'}`);
  }

  // ---- COMPLETION SCREEN ----
  function checkAllLevelsCompleted() {
    const allCompleted = levels.every(level => level.completed);
    
    if (allCompleted && levels.length > 0) {
      showCompletionScreen();
    }
  }

  function showCompletionScreen() {
    // Hide all sections
    document.getElementById('upload-section').classList.add('hidden');
    document.getElementById('study-section').classList.add('hidden');
    document.getElementById('levels-section').classList.add('hidden');
    document.getElementById('quiz-section').classList.add('hidden');
    document.getElementById('profile-section').classList.add('hidden');
    
    // Create completion screen if it doesn't exist
    let completionScreen = document.getElementById('completion-screen');
    if (!completionScreen) {
      completionScreen = document.createElement('section');
      completionScreen.id = 'completion-screen';
      completionScreen.className = 'card completion-screen';
      completionScreen.innerHTML = `
        <div class="completion-content">
          <div class="completion-icon">🎉</div>
          <h2>Congratulations Champion! 🏆</h2>
          <div class="quote-section">
            <p class="quote">"The beautiful thing about learning is that no one can take it away from you."</p>
          </div>
          <div class="achievement-message">
            <h3>You've Mastered the Material! 🌟</h3>
            <p>You've successfully completed all ${levels.length} levels with incredible dedication and intelligence!</p>
            <div class="stats-highlight">
              <div class="stat-highlight">
                <span class="stat-number">${users[currentUser].completedLevels.length}</span>
                <span class="stat-label">Levels Conquered</span>
              </div>
              <div class="stat-highlight">
                <span class="stat-number">${users[currentUser].xp}</span>
                <span class="stat-label">XP Earned</span>
              </div>
              <div class="stat-highlight">
                <span class="stat-number">${users[currentUser].totalQuestions > 0 ? Math.round((users[currentUser].correctAnswers / users[currentUser].totalQuestions) * 100) : 0}%</span>
                <span class="stat-label">Accuracy</span>
              </div>
            </div>
          </div>
          <div class="motivational-message">
            <p>Your persistence and smart approach to learning have paid off tremendously. You're not just a student - you're a knowledge warrior! 💪</p>
            <p>Remember: Every page you've studied has made you stronger and more capable. Keep this momentum going!</p>
          </div>
          <button id="btn-go-home" class="btn btn-primary btn-large">Continue Your Learning Journey 🚀</button>
        </div>
      `;
      document.querySelector('.main-content').appendChild(completionScreen);
      
      // Add event listener for the home button
      document.getElementById('btn-go-home').addEventListener('click', goToHomePage);
    }
    
    completionScreen.classList.remove('hidden');
  }

  function goToHomePage() {
    // Reset to upload section (home page)
    document.getElementById('completion-screen').classList.add('hidden');
    document.getElementById('upload-section').classList.remove('hidden');
    document.getElementById('profile-section').classList.remove('hidden');
    
    // Reset file input
    document.getElementById('pdf-file').value = '';
    
    showMessage('Ready for your next learning adventure! Upload another PDF to continue.', 'success');
  }

  // ---- XP SYSTEM ----
  function addXP(val) {
    users[currentUser].xp += val;
  }

  function updateProfile() {
    if (!currentUser || !users[currentUser]) return;
    
    const user = users[currentUser];
    document.getElementById('profile-xp').innerText = user.xp;
    document.getElementById('profile-completed').innerText = user.completedLevels.length;
    
    const accuracy = user.totalQuestions > 0 ? 
      Math.round((user.correctAnswers / user.totalQuestions) * 100) : 0;
    document.getElementById('profile-accuracy').innerText = `${accuracy}%`;
    
    document.getElementById('xp-fill').style.width = Math.min(user.xp, 100) + '%';
    document.getElementById('xp-text').innerText = 'XP: ' + user.xp;
  }

  // ---- UTILITIES ----
  function showLoginMessage(message, type = 'info') {
    loginMessage.textContent = message;
    loginMessage.className = `message ${type}`;
    setTimeout(() => {
      loginMessage.textContent = '';
      loginMessage.className = 'message';
    }, 3000);
  }

  function showMessage(message, type = 'info') {
    const messagesEl = document.getElementById('messages');
    messagesEl.textContent = message;
    messagesEl.className = type;
    setTimeout(() => {
      messagesEl.textContent = '';
      messagesEl.className = '';
    }, 4000);
  }

  // Debug function
  window.clearAppData = function() {
    localStorage.removeItem('users');
    users = {};
    location.reload();
  };
});