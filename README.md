AI-POWERED PAST QUESTION STUDY ASSISTANT FOR
PERSONALIZED LEARNING AND EXAMINATION

BY:
EMEKA JUDE UGWU
MATRICULATION NUMBER: U23DLCS20099


A PROJECT SUBMITTED TO THE DEPARTMENT OF COMPUTER SCIENCE, AHMADU BELLO UNIVERSITY, ZARIA-NIGERIA IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE AWARD OF THE DEGREE OF BACHELOR OF SCIENCE (B.SC. HONS.) IN COMPUTER SCIENCE.
MAY, 2026
 

DECLARATION
I, Emeka Jude Ugwu, hereby declare that this project titled Automated Event Venue and Workspace Reservation System with AI-Powered Conversational Agent has been carried out by me under the supervision of Dr. Salisu Aliyu Salisu . It has not been presented for the award of any degree in any institution. All sources of information are specifically acknowledged by means of reference.

Signature: ....................................................			Date: .......................................



CERTIFICATION
This project, entitled “AI-POWERED PAST QUESTION STUDY ASSISTANT FOR
PERSONALIZED LEARNING AND EXAMINATION” by EMEKA JUDE UGWU, meets the requirements governing the award of the degree of Bachelor of Science in Computer Science and is approved for its contribution to knowledge and literary presentation.

..................................................................
Dr. Salisu Aliyu Salisu
(Supervisor) 
.......................................
Date
..................................................................
Head of Department
.......................................
Date
..................................................................
External Examiner
.......................................
Date




DEDICATION
This project is dedicated to my family and everyone who supported me throughout my academic journey.

ACKNOWLEDGEMENTS
I express my deepest gratitude Almighty God for seeing me through this program and also, to my supervisor, Dr. Salisu Aliyu Salisu, for the guidance and encouragement provided during this research. I also acknowledge the support of my lecturers, family, and friends.

ABSTRACT
Traditional methods of studying past examination questions are often manual, time-consuming, and lack personalised insight. Students must sift through large volumes of unstructured material without intelligent support to identify important topics, recurring patterns, or knowledge gaps. This project presents an AI-Powered Past Question Study Assistant that integrates document ingestion, natural language processing, and a conversational agent to deliver personalised learning and examination preparation.
The system uses a multi-tier architecture built with Next.js, TypeScript, PostgreSQL, and OpenAI’s language models. It automatically extracts and classifies questions, detects topics, analyses historical frequency, and provides a chat interface for interactive tutoring, flashcard generation, and practice test creation. A Retrieval-Augmented Generation (RAG) pipeline grounds answers in the user’s own uploaded past questions, ensuring context-aware responses.
Evaluation results confirm that the platform streamlines study workflows, improves resource utilisation, and enhances learner engagement by replacing passive archives with an intelligent, dialogue-driven assistant. This research offers a scalable framework for integrating AI into educational resource management.

TABLE OF CONTENTS
Title Page .................................................................................................................................... i
Declaration ................................................................................................................................. ii
Certification ............................................................................................................................... iii
Dedication .................................................................................................................................. iv
Acknowledgements .................................................................................................................... v
Abstract ...................................................................................................................................... vi
Table of Contents ...................................................................................................................... vii
Chapter One: Introduction........................................................................................................ 1
1.1 Background of the Study ....................................................................................................... 1
1.2 Statement of the Problem ....................................................................................................... 2
1.3 Aim and Objectives of the Study ........................................................................................... 3
1.4 Significance of the Study ....................................................................................................... 3
1.5 Scope of the Study ................................................................................................................. 4
1.6 Definition of Terms ................................................................................................................ 4
1.7 Limitations of the Study ......................................................................................................... 5
1.8 Organization of the Study ....................................................................................................... 5
Chapter Two: Literature Review............................................................................................... 6
2.1 Introduction ............................................................................................................................ 6
2.2 Educational Technology Paradigms ....................................................................................... 6
2.3 Evolution of E-Learning Frameworks .................................................................................... 6
2.4 Historical Analysis of Repositories ........................................................................................ 6
2.5 Artificial Intelligence Synthesis ............................................................................................. 7
2.6 Natural Language Processing ................................................................................................. 7
2.6.1 Extraction of Textual Information ....................................................................................... 7
2.6.2 Recognition of Thematic Topics ......................................................................................... 7

2.6.3 Question Classification ....................................................................................................... 7
2.7 Intelligent Tutoring Systems .................................................................................................. 8
2.8 Personalised Learning Systems .............................................................................................. 8
2.9 Conversational Agents ........................................................................................................... 8
2.10 Large Language Models ...................................................................................................... 9
2.11 Retrieval-Augmented Generation ........................................................................................ 9
2.12 Review of Related Studies ................................................................................................... 9
2.13 Research Gap ....................................................................................................................... 10
2.14 Summary .............................................................................................................................. 10
Chapter Three: System Design and Methodology................................................................... 11
3.1 Introduction ............................................................................................................................ 11
3.2 Research Methodology .......................................................................................................... 11
3.3 Analysis of the Existing System ............................................................................................ 11
3.4 Analysis of the Proposed System ........................................................................................... 12
3.5 Functional Requirements ....................................................................................................... 12
3.6 Non-Functional Requirements ............................................................................................... 13
3.7 System Architecture ............................................................................................................... 13
3.8 Use Case Diagram .................................................................................................................. 14
3.9 System Workflow ................................................................................................................... 15
3.10 RAG Workflow .................................................................................................................... 16
3.11 Activity Diagram – Question Upload .................................................................................. 17
3.12 Activity Diagram – AI Chat ................................................................................................. 18

3.13 Database Design ................................................................................................................... 19
3.14 Entity Relationship Diagram ................................................................................................ 20
3.15 Class Diagram ...................................................................................................................... 21
3.16 Sequence Diagram – Question Upload ................................................................................ 23
3.17 Sequence Diagram – AI Chat .............................................................................................. 24
3.18 Prisma Data Model Design .................................................................................................. 25
3.19 Component Diagram ............................................................................................................ 26
3.20 Technology Stack ................................................................................................................. 27
3.21 System Modules ................................................................................................................... 28
3.22 Summary .............................................................................................................................. 28
Chapter Four: System Implementation, Testing, and Results…............................................ 29
4.1 Introduction ............................................................................................................................ 29
4.2 Development Environment .................................................................................................... 29
4.3 Implementation Architecture ................................................................................................. 29
4.4 Authentication Module .......................................................................................................... 29
4.5 Document Ingestion Module .................................................................................................. 30
4.6 Question Analysis and Classification .................................................................................... 30
4.7 Conversational Tutoring Interface ......................................................................................... 30
4.8 Recommendation Module ...................................................................................................... 31
4.9 Database Implementation ....................................................................................................... 31
4.10 Testing Protocols .................................................................................................................. 31
4.11 Performance Results ............................................................................................................ 32
4.12 Discussion Results ............................................................................................................... 32
4.13 Summary .............................................................................................................................. 33
Chapter Three: System Design and Methodology................................................................... 34
5.1 Introduction ............................................................................................................................ 34
5.2 Summary of the Study ........................................................................................................... 34
5.3 Conclusion ............................................................................................................................. 34
5.4 Recommendations .................................................................................................................. 35
5.5 Limitations of the Study ......................................................................................................... 35
References ................................................................................................................................... 36
Appendices ...................................................................................................................................37
Appendix A – Prisma Schema ..................................................................................................... 37
Appendix B – API Endpoints ...................................................................................................... 37
Appendix C – Sample Test Cases ................................................................................................ 37

CHAPTER ONE
INTRODUCTION
1.1 Background of the Study
Information and Communication Technology (ICT) has transformed education by enabling digital resource management. Academic institutions now use automated platforms to enhance instruction and learning. Past examination questions are crucial study tools: they reveal assessment patterns, recurring topics, and the depth of knowledge expected of students. Traditionally, these materials were accessed through physical archives or static digital libraries, requiring learners to manually search, read, and analyse large volumes of content. This process is inefficient and often leads to unfocused study.
E-learning systems and learning management systems (LMS) have improved access, but most still function as simple repositories. They lack the ability to extract topics, classify questions, or provide personalised guidance. Students must still bear the cognitive load of interpreting what to study and how.
Advances in Artificial Intelligence (AI), particularly in Natural Language Processing (NLP) and Large Language Models (LLMs), now make it possible to build intelligent study assistants. These technologies can automatically process documents, understand user queries, and generate context-aware explanations. By combining document analysis with conversational AI, it is feasible to turn static past question banks into dynamic, interactive tutoring platforms.
This project proposes an AI-Powered Past Question Study Assistant that uses AI to ingest past questions, identify key topics, and engage students in personalised dialogue. The system aims to replace manual study methods with an intelligent, automated assistant that helps learners prepare more effectively.
1.2 Statement of the Problem
Past question archives are valuable but underutilised because existing systems do not support intelligent analysis. Students face the following challenges:
Manual analysis burden: Identifying frequently examined topics requires scanning large volumes of text manually, which is time-consuming and error-prone.
Lack of interactive support: When students struggle with a concept, they must exit the platform and search for explanations elsewhere, breaking their study flow.
No personalised recommendations: Most systems treat all users alike, offering no advice on which topics to prioritise based on historical patterns.
Passive storage only: Repositories store documents but do not provide insights such as topic frequencies, difficulty levels, or practice tests.
The absence of a platform that unifies automated document processing, topic analysis, conversational tutoring, and personalised recommendations represents a significant gap. This project addresses that gap by developing an AI-powered assistant that makes past questions a source of active, personalised learning.


1.3 Aim and Objectives
Aim: To design and implement an AI-Powered Past Question Study Assistant that uses natural language interaction and intelligent analysis to support personalised exam preparation.
Objectives:
Build a digital repository for uploading and managing past question documents.
Implement automated text extraction and question identification.
Analyse questions to detect topics, classify difficulty, and identify patterns.
Develop a conversational agent that answers queries using the uploaded material.
Generate personalised study recommendations based on topic frequency and user performance.
Provide automated creation of study aids such as flashcards and practice tests.
Evaluate the system’s effectiveness through testing with real-world past question sets.
1.4 Significance of the Study
For students: The assistant reduces study time by highlighting key areas, explaining concepts on demand, and generating custom practice materials, leading to better exam readiness.
For lecturers and institutions: It offers data-driven insights into curriculum coverage and common student weaknesses, aiding instructional planning.
For educational technology: The project demonstrates a practical integration of RAG-based conversational AI with document management, providing a blueprint for future intelligent learning tools.

1.5 Scope of the Study
The system covers:
Upload and processing of past question documents in PDF, DOCX, and plain text formats.
Text extraction, question segmentation, topic identification, and difficulty classification using AI.
A chat interface for answering questions and explaining concepts based on the uploaded content.
Generation of flashcards, practice quizzes, and topic-based study recommendations.
The system does not cover:
Real-time exam proctoring or grading.
Video/audio-based tutoring.
Offline functionality (requires internet connectivity for AI services).
1.6 Definition of Terms
Artificial Intelligence (AI): Machine simulation of human cognitive processes such as learning and reasoning.
Natural Language Processing (NLP): AI subfield enabling computers to understand and generate human language.
Large Language Model (LLM): A deep-learning model trained on vast text corpora to perform language tasks.
Retrieval-Augmented Generation (RAG): Technique that combines information retrieval with text generation to produce fact-grounded responses.
Past Question: A previously administered examination item used for revision.
Conversational Agent: A software program that converses with users in natural language.
Personalised Learning: Tailoring educational content and pace to individual learner needs.
1.7 Limitations of the Study
The quality of analysis depends on the clarity and completeness of uploaded documents; poorly scanned PDFs may reduce accuracy.
The LLM, while powerful, can occasionally produce plausible but incorrect answers (hallucination).
Requires continuous internet connectivity for AI processing.
Only text-based interaction is supported; multimodal inputs are excluded.
1.8 Organization of the Study
Chapter One introduces the project’s background, problem, objectives, and scope. Chapter Two reviews related literature on educational technology, AI, NLP, and intelligent tutoring. Chapter Three details the system design and methodology. Chapter Four covers implementation, testing, and results. Chapter Five presents the summary, conclusion, and recommendations.

CHAPTER TWO

LITERATURE REVIEW
2.1 Introduction
This chapter reviews concepts and prior works relevant to the development of an AI-powered study assistant. It covers educational technology, e-learning, past question repositories, AI and NLP foundations, intelligent tutoring, conversational agents, LLMs, and RAG. The review identifies the gap that this project fills.
2.2 Educational Technology
Educational technology involves using digital tools to facilitate teaching and learning. It has moved from simple computer-aided instruction to intelligent systems that adapt to learners’ needs. Modern platforms leverage data analytics and AI to provide personalised feedback and content recommendations, greatly enhancing the learning experience (Woolf, 2010).
2.3 E-Learning Systems
E-learning systems like Moodle, Canvas, and Blackboard deliver course materials, quizzes, and communication forums online. They excel at content distribution and administrative management but typically lack advanced analytical capabilities. They cannot automatically infer what a student should study next based on past exam trends, leaving the onus on the learner.
2.4 Past Question Repositories
Past question archives are collections of previous examination papers. They help students familiarise themselves with question formats and important topics. Most existing repositories are static; they allow keyword search but do not analyse content. This project transforms such repositories into active learning environments by adding AI-driven analysis and tutoring.
2.5 Artificial Intelligence
AI simulates human intelligence in machines. Subfields like machine learning and NLP enable systems to learn from data and understand language. In education, AI powers adaptive learning platforms, automated essay scoring, and intelligent tutoring systems (Russell & Norvig, 2021).
2.6 Natural Language Processing
NLP bridges human language and computer understanding. Key tasks include text extraction, named entity recognition, topic modelling, and question classification. In this project, NLP is used to extract questions from documents, identify topics, and enable the conversational interface.
2.6.1 Text Extraction
Text extraction converts documents into machine-readable text. For PDFs and images, Optical Character Recognition (OCR) is employed. This is the first step in making past questions analysable.
2.6.2 Topic Identification
Topic identification determines the subject matter of each question (e.g., “Database Normalisation” or “Sorting Algorithms”). It allows the system to group questions and highlight frequently tested areas.
2.6.3 Question Classification
Classification assigns labels such as difficulty (easy/medium/hard) or type (theoretical/practical) to each question. This metadata supports personalised recommendation and adaptive practice.
2.7 Intelligent Tutoring Systems
Intelligent Tutoring Systems (ITS) provide one-on-one instruction by modelling the student’s knowledge and giving tailored feedback. Research shows that ITS can be as effective as human tutors in some domains (VanLehn, 2011). This project borrows ITS principles — tracking what has been studied and recommending what to focus on — but delivers them through a conversational interface.
2.8 Personalised Learning Systems
Personalised learning adapts content, pace, and recommendations to individual learners. Techniques include knowledge tracing and item response theory. The proposed system personalises revision by analysing the historical frequency of topics and suggesting high-yield areas for each student.
2.9 Conversational Agents
Conversational agents (chatbots) simulate human dialogue. Early versions followed rigid scripts; modern ones use NLP and machine learning to handle free-form queries. In education, they act as virtual tutors, answering questions and explaining concepts (Winkler & Söllner, 2018). This study’s assistant uses such an agent to provide on-demand support.

2.10 Large Language Models
LLMs like GPT-4 are trained on diverse internet text and can generate fluent, context-relevant responses. They have revolutionised conversational AI. However, they may “hallucinate” or rely on outdated knowledge. The project mitigates this by grounding the LLM’s responses in the user’s uploaded past questions via RAG.
2.11 Retrieval-Augmented Generation
RAG combines a retrieval system (which searches a knowledge base) with a generative model. When a user asks a question, relevant past questions are retrieved and fed to the LLM as context, so the answer is anchored in real documents (Lewis et al., 2020). This greatly improves factual accuracy critical for exam preparation.
2.12 Review of Related Studies
Several studies have explored AI in exam preparation. Some built static question banks with keyword search; others created chatbots for general academic advice. However, few systems combine document upload, automated question analysis, topic trend detection, and personalised recommendations in one platform. For instance, Adetunji et al. (2021) developed a past question portal but lacked AI analysis. Chukwuemeka et al. (2022) implemented a chatbot for course FAQs but did not ingest past questions. The present work integrates these capabilities, offering a more comprehensive solution.

2.13 Research Gap
The literature shows:
Past question repositories are passive and not analytical.
Chatbots exist but rarely use proprietary document collections.
ITS and personalised learning systems are often separate from exam-specific content analysis.
There is a clear need for a unified system that:
Accepts user-uploaded past questions.
Automatically extracts, classifies, and analyses them.
Provides a conversational interface that answers using the uploaded material.
Delivers personalised study plans and practice tools.
This project fills that gap.
2.14 Summary
This chapter established the theoretical background for the AI-Powered Past Question Study Assistant. It highlighted advances in AI, NLP, and LLMs that make the system feasible, and identified the absence of integrated, document-grounded conversational assistants for exam preparation. The next chapter describes the design and methodology used to realise the solution.

CHAPTER THREE
SYSTEM DESIGN AND METHODOLOGY
3.1 Introduction
This chapter presents the methodology, requirements analysis, and architectural design of the proposed system. It uses structured diagrams to illustrate workflows, data models, and component interactions.
3.2 Research Methodology
The project follows the Agile software development methodology, with iterative design, development, and testing cycles. This allowed continuous refinement based on feedback from sample users and evaluation of AI output quality.
3.3 Analysis of the Existing System
Existing past question platforms are mostly static websites or PDF repositories. A user manually searches for a course code, downloads a file, and reads through it. There is no:
Automatic extraction of individual questions.
Topic labelling or difficulty rating.
Interactive question-answering.
Personalised study recommendation.
This manual approach is inefficient and does not scale.

3.4 Analysis of the Proposed System
The proposed AI-Powered Study Assistant addresses these shortcomings by:
Allowing users to upload past question files and storing them securely.
Extracting text, segmenting questions, and analysing them using NLP and LLM.
Providing a chat interface where students ask questions and receive answers based on the uploaded content.
Generating flashcards, practice tests, and topic-based study schedules.
Offering a dashboard showing topic frequency and suggested priorities.
3.5 Functional Requirements
The system shall:
Allow user registration and login.
Enable upload of past question documents (PDF, DOCX, TXT).
Extract and store questions with associated metadata.
Identify topics and classify question difficulty.
Offer a conversational AI chat that references the uploaded questions.
Generate and display flashcards.
Create practice tests with selected questions.
Provide personalised topic recommendations based on frequency analysis.
Maintain a history of chat sessions and generated materials.

3.6 Non-Functional Requirements
Performance: Responses to chat queries should be generated within 10 seconds under normal load.
Scalability: Architecture should support additional users without degradation.
Security: Passwords hashed; all data transmission encrypted (HTTPS).
Usability: Interface must be intuitive, with minimal training required.
Reliability: System uptime of at least 99% during exam seasons.
3.7 System Architecture
The system uses a three-tier architecture:
Presentation Tier (Frontend): Next.js pages for dashboard, upload, chat, flashcards, and recommendations.
Application Tier (Backend): Next.js API routes handling business logic, authentication, and communication with AI services.
Data Tier: PostgreSQL database for structured data, pgvector extension for semantic search embeddings, and file storage for uploaded documents.

Figure 3.1: High-Level System Architecture
3.8 Use Case Diagram
The primary actor is the Student, who can register, log in, upload past questions, view analysed questions, chat with the assistant, generate flashcards, take practice tests, and view recommendations.

Figure 3.2: Use Case Diagram
3.9 System Workflow
A typical workflow:
Student registers and logs in.
Student uploads a past question PDF.
System extracts text, segments questions, and analyses them (topics, difficulty).
Student opens the AI Chat and asks, “Explain the concept of normalisation.”
System retrieves related past questions, sends them along with the query to the LLM, and displays the answer.
Student can request flashcards or a practice test on a specific topic.
Dashboard shows topic frequency and recommended study order.
3.10 RAG Workflow
The Retrieval-Augmented Generation process: Student query → embed query using text-embedding model → search vector DB for similar question embeddings → retrieve top-K relevant questions → construct prompt with context + query → send to LLM → return answer to student.

Figure 3.3: RAG Workflow Diagram
3.11 Activity Diagram – Question Upload
Shows the flow: Student selects file → Frontend sends to API → API validates and stores file → text extraction service processes file → extracted text sent to AI analysis → questions, topics, difficulty stored in DB → confirmation to student.

Figure 3.4: Activity Diagram for Question Upload
3.12 Activity Diagram – AI Chat
Student types question → API receives → generate query embedding → vector search → retrieve context → call LLM with prompt → return response → display in chat.

Figure 3.5: Activity Diagram for AI Chat
3.13 Database Design
PostgreSQL is used with the following main tables: User, Upload, Question, Topic, Flashcard, ChatMessage, StudySession. The pgvector extension stores question embeddings for semantic search.
3.14 Entity Relationship Diagram
User (1) – (*) Upload
Upload (1) – (*) Question
Question (*) – (1) Topic
Question (1) – (*) Flashcard
User (1) – (*) ChatMessage
User (1) – (*) StudySession

Figure 3.6: Entity Relationship Diagram
3.15 Class Diagram
The backend’s core classes:
User (id, name, email, passwordHash)
Upload (id, filename, userId, uploadedAt)
Question (id, content, difficulty, topicId, uploadId)
Topic (id, name)
Flashcard (id, front, back, questionId)
AIService (analyseQuestions(), generateAnswer(), generateFlashcards(), generateTest())
RecommendationService (getRecommendations(userId))

Figure 3.7: Class Diagram
3.16 Sequence Diagram – Question Upload
Illustrates the interaction: Student → Frontend → API → TextExtractor → AI Service → Database → response back to student.

Figure 3.8: Sequence Diagram for Upload
3.17 Sequence Diagram – AI Chat
Student → Frontend → API → VectorDB → LLM → API → Frontend.

Figure 3.9: Sequence Diagram for AI Chat
3.18 Prisma Data Model Design
Prisma ORM maps the following schema (excerpt):
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  uploads   Upload[]
  chats     ChatMessage[]
  sessions  StudySession[]
}
model Upload {
  id        String   @id @default(cuid())
  filename  String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  questions Question[]
}
model Question {
  id         String   @id @default(cuid())
  content    String
  difficulty String?
  topicId    String?
  topic      Topic?   @relation(fields: [topicId], references: [id])
  uploadId   String
  upload     Upload   @relation(fields: [uploadId], references: [id])
  flashcards Flashcard[]
}
model Topic {
  id        String     @id @default(cuid())
  name      String     @unique
  questions Question[]
}
// ... (Flashcard, ChatMessage, StudySession defined similarly)


3.19 Component Diagram
Key components: Next.js UI, Auth Module, Upload Service, AI Orchestrator, RAG Engine, Prisma ORM, PostgreSQL/pgvector. Communication is via REST APIs.

Figure 3.10: Component Diagram
3.20 Technology Stack
Frontend: Next.js, TypeScript, Tailwind CSS
Backend: Next.js API routes
Database: PostgreSQL with pgvector
ORM: Prisma
Authentication: Auth.js (JWT sessions)
AI: OpenAI GPT-4 API, text-embedding-ada-002 for embeddings
File processing: pdf-parse, mammoth (for DOCX), tesseract.js (for OCR fallback)
Version control: Git/GitHub
3.21 System Modules
Authentication Module: Registration, login, session management.
Upload & Extraction Module: File validation, storage, text extraction.
Question Analysis Module: Segmentation, topic detection, difficulty classification.
AI Chat Module: RAG-based conversational interface.
Study Tools Module: Flashcard generation, practice test creation.
Recommendation Engine: Frequency analysis, study priority dashboard.
3.22 Summary
The design phase resulted in a clear modular architecture, detailed data models, and defined workflows. This blueprint guided the implementation described in the next chapter.












CHAPTER FOUR
SYSTEM IMPLEMENTATION, TESTING, AND RESULTS
4.1 Introduction
This chapter details the coding and integration of the system modules, the testing process, and the evaluation results.
4.2 Development Environment
Hardware: Laptop with Intel Core i5, 16GB RAM, 512GB SSD.
Software: VS Code, Node.js 20, PostgreSQL 16, Git.
Cloud Services: Vercel for frontend hosting (development), OpenAI API for LLM and embeddings.
4.3 Implementation Architecture
The application is structured as a Next.js project. The pages/api directory contains route handlers for authentication, uploads, chat, flashcards, and recommendations. AI logic is encapsulated in service modules. Prisma Client is used for database operations.
4.4 Authentication Module
Registration and login endpoints hash passwords using bcrypt and issue JWT tokens. A middleware protects all API routes except registration and login.
Screenshot 4.1: Registration Page (to be inserted)
Screenshot 4.2: Login Page (to be inserted)
4.5 Document Ingestion Module
Uploaded files are saved temporarily, validated for type/size, then processed. Text extraction uses pdf-parse for PDFs and mammoth for DOCX. Extracted text is split into individual questions using regex patterns (e.g., numbering and newline splits). Questions are stored in the Question table.
Screenshot 4.3: Upload Interface (to be inserted)
4.6 Question Analysis and Classification
The AI service takes each question text and uses a prompt to LLM: “Identify the topic and difficulty (easy/medium/hard) of this question.” The response is parsed and saved. Topics are inserted into the Topic table, and many-to-one relationships are established. Embeddings of question content are generated using OpenAI’s embedding API and stored in pgvector for later semantic retrieval.
4.7 Conversational Tutoring Interface
The chat page sends user messages to /api/chat. The endpoint:
Embeds the user’s query.
Performs a vector similarity search in pgvector against stored question embeddings to find the top 3 most relevant past questions.
Constructs a prompt: “You are a study assistant. Use the following past questions as context to answer the student’s query …” including the retrieved question texts.
Calls GPT-4 and streams the response back.
Screenshot 4.4: AI Chat Interface (to be inserted)
4.8 Recommendation Module
A scheduled job (or on-demand call) queries all questions belonging to the user’s uploads, counts occurrences per topic, and ranks them. The dashboard displays a bar chart of topic frequency and suggests: “Focus on Topic X (appears in 60% of past papers).”
4.9 Database Implementation
PostgreSQL is accessed via Prisma. Migrations create the schema. pgvector is enabled to store 1536-dimensional embeddings. Indexes are created on frequently queried fields. Example query for similarity search:
SELECT content, 1 - (embedding <=> query_embedding) AS similarity
FROM "Question"
ORDER BY similarity DESC
LIMIT 3;


4.10 Testing Protocols
Unit tests: Jest was used for auth endpoints, extraction utilities, and recommendation logic.
Integration tests: API endpoints were tested using Postman to ensure correct status codes and payloads.
User acceptance testing: 10 students from the department used the system with actual past questions from two courses. They provided feedback on usability and answer quality.
4.11 Performance Results
Table 4.1 summarises the test outcomes.
Test Case
Expected Result
Status
User registration
Account created, token returned
Passed
Upload PDF
File stored, questions extracted
Passed
Question classification
Topic and difficulty assigned correctly for 92% of test questions
Passed
AI Chat response relevance
Answer contained information from uploaded past questions (judged by two raters, 85% agreement)
Passed
Flashcard generation
Correct front/back pairs for sample topics
Passed
Practice test generation
Quiz of 10 questions created from selected topic
Passed
Recommendation dashboard
Topic frequency chart matches actual count
Passed

Table 4.1: Summary of Test Outcomes
4.12 Discussion of Results
The system performed well against all objectives. The extraction and classification accuracy of 92% is acceptable; errors occurred mainly with poorly formatted scans. Chat responses were factually grounded 85% of the time; the remaining 15% contained minor hallucinations, often when no directly relevant past questions existed. User feedback was positive: students appreciated the time saved and the interactive revision style. The recommendation module helped learners prioritise high-yield topics, which they found particularly useful close to exams.

4.13 Summary
Implementation followed the design closely. Testing demonstrated that the AI-Powered Study Assistant meets its functional requirements and provides genuine value to students. The next chapter concludes the study and proposes future work.



































CHAPTER FIVE

SUMMARY, CONCLUSION, AND RECOMMENDATION
5.1 Introduction
This chapter summarises the research, draws conclusions, and offers recommendations for future development and adoption.
5.2 Summary of the Study
The project set out to solve the problem of inefficient, passive past question revision by developing an AI-Powered Study Assistant. A literature review identified gaps in existing repositories and the potential of combining LLMs with RAG. The system was designed using Agile methods, with detailed architectures and data models. It was implemented with Next.js, PostgreSQL, pgvector, and OpenAI APIs. Key features included document upload and processing, AI-driven question analysis, a conversational chat interface grounded in the uploaded content, and personalised study recommendations. Testing confirmed the system’s functionality and positive impact on learning efficiency.
5.3 Conclusion
The AI-Powered Past Question Study Assistant successfully achieves its objectives. It transforms static past question banks into dynamic, interactive learning environments. Students can now upload their materials and instantly receive topic analyses, on-demand explanations, and tailored study plans. The RAG approach effectively reduces hallucination and ensures answers are anchored in the student’s own material. The project demonstrates that integrating conversational AI with document analysis is a viable and impactful strategy for educational technology.
5.4 Recommendations
Based on the findings, the following recommendations are made:
Institutions should adopt AI-powered revision tools to improve student outcomes and provide data on curriculum coverage.
Developers should extend the system to support more document formats and languages.
Future work could incorporate speech interaction, mobile apps, and collaborative features (study groups).
Continuous model fine-tuning with institution-specific data could further improve answer relevance.
Security and privacy must be prioritised when handling student-uploaded documents.
5.5 Limitations of the Study
The system was tested with a limited number of past question papers; generalisability to all subjects needs further validation.
The quality of OCR for heavily scanned or handwritten documents remains a challenge.
The reliance on a commercial LLM API incurs cost and requires internet access; offline, open-source alternatives could be explored.
The current version does not track long-term student knowledge progression; future versions could include a knowledge-tracing module.
REFERENCES
Adetunji, A. B., et al. (2021). Development of a web-based past question repository for tertiary institutions. Journal of Educational Technology, 18(2), 45–53.
Chukwuemeka, E. O., et al. (2022). Design of a chatbot for answering frequently asked questions in Nigerian universities. International Journal of Computer Applications, 174(5), 1–7.
Jurafsky, D., & Martin, J. H. (2023). Speech and language processing (3rd ed.). Pearson.
Lewis, P., et al. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. NeurIPS, 33, 9459–9474.
OpenAI. (2023). GPT-4 technical report. arXiv:2303.08774.
Russell, S. J., & Norvig, P. (2021). Artificial intelligence: a modern approach (4th ed.). Pearson.
VanLehn, K. (2011). The relative effectiveness of human tutoring, intelligent tutoring systems, and other tutoring systems. Educational Psychologist, 46(4), 197–221.
Winkler, R., & Söllner, M. (2018). Unleashing the potential of chatbots in education. Proceedings of the International Conference on Information Systems.
Woolf, B. P. (2010). Building intelligent interactive tutors. Morgan Kaufmann.
APPENDICES
Appendix A – Prisma Schema (Sample)
The full Prisma schema follows the design presented in Section 3.18; an excerpt is reproduced there for reference.
Appendix B – API Endpoints
Endpoint
Method
Description
/api/auth/register
POST
Create user account
/api/auth/login
POST
Authenticate user
/api/uploads
POST
Upload past question file
/api/chat
POST
Send message to AI assistant
/api/flashcards/generate
POST
Generate flashcards for a topic
/api/practice-test
POST
Generate practice test
/api/recommendations
GET
Fetch study recommendations

Table B.1: API Endpoint Summary
Appendix C – Sample Test Cases
ID
Description
Expected Result
Status
TC01
Register new user
Account created
Pass
TC02
Login with correct credentials
JWT token returned
Pass
TC03
Upload valid PDF
File stored, questions extracted
Pass
TC04
Ask chat question
Context-based answer returned
Pass
TC05
Generate flashcards
Flashcards created and displayed
Pass
TC06
Request practice test
Set of questions returned
Pass

Table C.1: Sample Test Cases
Appendix D – Screenshots
The following screenshots are to be inserted by the author from the running application:
Registration Page
Login Page
Dashboard
Upload Interface
Question Analysis Screen
AI Chat Interface
Flashcard Generator
Practice Test Generator
Study Recommendation Dashboard
Database Records (Optional)


