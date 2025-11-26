import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

export interface ParsedTaskData {
  title: string;
  description: string;
  category: string;
  priority: string;
  estimatedHours: number;
  projectId?: string;
}

@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  private assistantId: string;

  constructor() {
    const apiKey = process.env.OPEN_AI_KEY;
    this.assistantId = process.env.OPEN_AI_ASSISTANT_ID || '';

    if (!apiKey) {
      throw new Error('OPEN_AI_KEY environment variable is not set');
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  async parseTaskFromNaturalLanguage(
    naturalLanguageInput: string,
    availableProjects: Array<{ id: string; name: string }>,
    availableCategories: string[],
    availablePriorities: string[],
  ): Promise<ParsedTaskData> {
    const projectsList = availableProjects
      .map((p) => `- ${p.name} (ID: ${p.id})`)
      .join('\n');

    const prompt = `You are a task parsing assistant. Parse the following natural language task description and extract structured data.

Natural Language Input:
"${naturalLanguageInput}"

Available Projects:
${projectsList}

Available Categories: ${availableCategories.join(', ')}
Available Priorities: ${availablePriorities.join(', ')}

Please analyze the input and return a JSON object with the following structure:
{
  "title": "A clear, concise task title (max 100 chars)",
  "description": "Detailed description of what needs to be done",
  "category": "One of the available categories that best fits",
  "priority": "One of the available priorities (LOW, MEDIUM, HIGH, CRITICAL)",
  "estimatedHours": "Estimated hours as a number (be realistic, default to 2-4 hours if unclear)",
  "projectId": "ID of the matching project if mentioned, otherwise null"
}

Rules:
1. Extract a clear, actionable title from the input
2. Create a detailed description explaining what needs to be done
3. Choose the most appropriate category from the available options
4. Infer priority based on urgency words (urgent, asap, critical, etc.)
5. Estimate realistic hours based on task complexity
6. Match project name if mentioned in the input
7. If no project is mentioned, set projectId to null
8. Return ONLY valid JSON, no markdown or explanations

Return the JSON object now:`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are a task parsing assistant. Always return valid JSON only, with no markdown formatting or additional text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const responseContent = completion.choices[0]?.message?.content;

      if (!responseContent) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const parsedData = JSON.parse(responseContent) as ParsedTaskData;

      // Validate and sanitize the response
      return {
        title: parsedData.title || 'Untitled Task',
        description: parsedData.description || naturalLanguageInput,
        category: this.validateCategory(parsedData.category, availableCategories),
        priority: this.validatePriority(parsedData.priority, availablePriorities),
        estimatedHours: this.validateEstimatedHours(parsedData.estimatedHours),
        projectId: parsedData.projectId || undefined,
      };
    } catch (error) {
      console.error('Error parsing task with OpenAI:', error);
      // Fallback: return basic parsed data
      return {
        title: naturalLanguageInput.slice(0, 100),
        description: naturalLanguageInput,
        category: availableCategories[0] || 'WEB_FRONTEND',
        priority: 'MEDIUM',
        estimatedHours: 3,
      };
    }
  }

  private validateCategory(
    category: string,
    availableCategories: string[],
  ): string {
    const upperCategory = category?.toUpperCase();
    return availableCategories.includes(upperCategory)
      ? upperCategory
      : availableCategories[0] || 'WEB_FRONTEND';
  }

  private validatePriority(
    priority: string,
    availablePriorities: string[],
  ): string {
    const upperPriority = priority?.toUpperCase();
    return availablePriorities.includes(upperPriority)
      ? upperPriority
      : 'MEDIUM';
  }

  private validateEstimatedHours(hours: any): number {
    const parsed = parseFloat(hours);
    if (isNaN(parsed) || parsed <= 0) {
      return 3; // Default to 3 hours
    }
    return Math.min(Math.max(parsed, 0.5), 100); // Between 0.5 and 100 hours
  }
}
