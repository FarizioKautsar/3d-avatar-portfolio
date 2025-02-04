'use server'

import * as yup from 'yup'
import { actionClient } from '@/lib/safe-action'
import { fetchFromOpenAi } from '../chatApi'
import OpenAI from 'openai'
import { fetchOpenAiStt } from '../sttApi'

const openAiSchema = yup.object().shape({
  messages: yup
    .array()
    .of(
      yup.object().shape({
        role: yup.string().oneOf(['system', 'user', 'assistant']).required(),
        content: yup.string().required(),
      }),
    )
    .required('Messages array is required'),
})

type OpenAiData = yup.InferType<typeof openAiSchema>

export const callOpenAi = actionClient
  .schema(openAiSchema)
  .action(async ({ parsedInput: { messages } }: { parsedInput: OpenAiData }) => {
    try {
      let parsedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = messages.map((message) => ({
        role: message.role,
        content: message.content,
      }))
      parsedMessages = [
        {
          role: 'assistant',
          content: `My name is Farizio Kautsar Heruzy. People call me Zi or Zio. I'm a web developer based in Melbourne, Australia. Here's my CV.

          Farizio Kautsar Heruzy
Full Stack Developer
Master of Information Technology | Student
Melbourne, VIC
Email: kheruzy@gmail.com
Phone: +61 433 842 778
LinkedIn: linkedin.com/in/farizio-kautsar-heruzy
Website: farizio.io

Education
Monash University, Melbourne
Master’s Degree in Information Technology
July 2024 - December 2025

Awarded a full ride scholarship from LPDP (Indonesia Endowment Fund for Education).
Universitas Indonesia
Bachelor’s Degree in Information System (GPA 3.40)
2018 - 2022

Work Experience
KotakodeLabs
Full Stack Developer and Project Tech Lead (Full-Time)
June 2022 - December 2024

Developed the profile websites for a gas and energy company (timas.com), an NFT project (vimb.io), and KotakodeLabs (klabs.dev) as the sole developer, collaborating closely with clients to ensure their satisfaction and the delivery of modern and sophisticated web applications.
Engineered a comprehensive learning management system and human resource information system for an international school of more than three hundred students, featuring a flexible grading system and integrated finance management system (klabs.dev/bbs-lms).
Led a team of three in building a web and mobile application using Expo for a consultation platform (counsely.app), which now supports more than two hundred active users.
Sayurbox
Backend Developer Intern
December 2021 - June 2022

Enhanced voucher features and optimized “Tebus Murah” campaigns to boost user engagement, while developing scalable solutions for the Sayurfluencer promotion program to support marketing initiatives, increasing user engagement by fifteen percent.
Resolved critical bugs and improved the internal content management system web application used by a fifteen-member team, ensuring seamless and efficient operations.
Kotakode
Full Stack Developer Intern
July 2021 - November 2021

Implemented a sitewide revamp by creating reusable and documented React user interface components, aligning with Kotakode’s design guidelines.
Developed the internal content management system website and seamlessly integrated it with the existing back-end system.
Built the full-stack Kotakode Academy feature, which enabled more than one thousand users to find and enroll in their preferred online courses.
Bukit Vista Bali
Front-End Developer and Product Owner Intern
July 2021 - November 2021

Developed interactive analytics visualizations for the BIGRR platform, empowering the human resources team to analyze and forecast talent acquisition.
Managed the WordPress website timeline, coordinated with team members, and monitored progress to meet project goals.
Leadership and Projects
LPDP PK-226
Representative of the LPDP Awardees of PK-226
January 2024 - March 2024

Selected as one of five representatives for two hundred and ninety-nine awardees during the PK (Persiapan Keberangkatan) program.
Supervised the administration and treasury team, ensuring task completion and process efficiency.
Facilitated inquiries and supported awardees regarding departures, schedules, task submissions, and other logistics.
Educare 2020
Head of Creative
June 2020 - August 2020

Designed engaging and cohesive branding posters, logos, and assets for the faculty’s education fair promotions.
Led a team of eight young designers and established an intuitive and well-documented design language using Figma.
Hadir App
An offline class attendance system

Full-Stack Developer, User Interface and User Experience Designer, Team Lead
Rumah Siap Kerja (RSK) Human Resources System
A web-based application for Rumah Siap Kerja’s internal human resources team

Full-Stack Developer (College Project)
Technical Skills
User Interface and User Experience Design

Figma (Four years)
Elementor (Three years)
WordPress (Three years)
Web and Mobile Development

ReactJS (Four years)
NextJS (Two years)
React Native and Expo (Two years)
NestJS (Two years)
ExpressJS (Two years)
Firebase (Two years)
Spring Boot (One year)
Svelte (Less than one year)
Django (One year)
Vue (Less than one year)
`,
        },
        ...parsedMessages,
      ]
      const response = await fetchFromOpenAi(parsedMessages)
      const choice = response.choices?.[0]
      return { success: true, message: choice?.message }
    } catch (error) {
      console.error('OpenAI API error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

const speechToTextSchema = yup.object().shape({
  file: yup.mixed().required('Audio file is required'),
})

type SpeechToTextData = yup.InferType<typeof speechToTextSchema>

export const speechToText = actionClient
  .schema(speechToTextSchema)
  .action(async ({ parsedInput: { file } }: { parsedInput: SpeechToTextData }) => {
    try {
      if (!file) {
        throw new Error('No file uploaded')
      }

      const transcription = await fetchOpenAiStt(file as File)

      return { success: true, transcription }
    } catch (error) {
      console.error('Speech-to-Text Error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
