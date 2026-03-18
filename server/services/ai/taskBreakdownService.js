const OpenAI = require('openai');

const INVALID_KEY_PATTERNS = [
  'your_openai_api_key_here',
  'your_openai',
  'replace_with',
  'placeholder'
];

const hasUsableApiKey = () => {
  const rawKey = String(process.env.OPENAI_API_KEY || '').trim();
  if (!rawKey) return false;

  const lowered = rawKey.toLowerCase();
  const isPlaceholder = INVALID_KEY_PATTERNS.some((pattern) => lowered.includes(pattern));
  if (isPlaceholder) return false;

  // OpenAI keys are expected to be prefixed; reject obvious non-keys early.
  return rawKey.startsWith('sk-');
};

// Initialize OpenAI client only if API key is available
let openai = null;
if (hasUsableApiKey()) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

/**
 * Break down a task into subtasks using AI
 */
async function breakdownTask(taskDescription, estimatedHours = null) {
  // If OpenAI is not configured, use fallback
  if (!openai) {
    return fallbackBreakdown(taskDescription, estimatedHours);
  }

  try {
    const prompt = `You are a productivity assistant. Break down the following task into smaller, actionable subtasks.

Task: "${taskDescription}"
${estimatedHours ? `Total estimated time: ${estimatedHours} hours` : ''}

Provide a JSON response with the following structure:
{
  "mainTask": "cleaned up version of the task title",
  "subtasks": [
    {
      "title": "subtask title",
      "estimatedMinutes": number,
      "order": number starting from 1,
      "tips": "optional helpful tip for this subtask"
    }
  ],
  "totalEstimatedMinutes": total minutes for all subtasks,
  "suggestions": "any additional suggestions for completing this task effectively"
}

Keep subtasks specific and actionable. Aim for 3-7 subtasks depending on complexity.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful productivity assistant that breaks down tasks into manageable subtasks. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const responseText = completion.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const breakdown = JSON.parse(jsonMatch[0]);
    
    return {
      success: true,
      ...breakdown
    };
  } catch (error) {
    // Disable OpenAI usage for this process when key/config is invalid.
    if (error?.status === 401 || error?.code === 'invalid_api_key' || error?.type === 'invalid_request_error') {
      openai = null;
      console.warn('AI breakdown: invalid OpenAI API key detected, using fallback breakdown.');
    } else {
      console.error('AI breakdown error:', error?.message || error);
    }
    
    // Fallback to rule-based breakdown
    return fallbackBreakdown(taskDescription, estimatedHours);
  }
}

/**
 * Fallback rule-based task breakdown when AI is unavailable
 */
function fallbackBreakdown(taskDescription, estimatedHours) {
  const totalMinutes = estimatedHours ? estimatedHours * 60 : 120;
  const lowerTask = taskDescription.toLowerCase();

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const rotateRandomly = (arr) => {
    if (!arr.length) return arr;
    const offset = Math.floor(Math.random() * arr.length);
    return arr.slice(offset).concat(arr.slice(0, offset));
  };

  // Common task patterns
  const patterns = {
    study: [
      [
        { title: 'Review notes and materials', ratio: 0.25 },
        { title: 'Create summary/outline', ratio: 0.15 },
        { title: 'Practice exercises/problems', ratio: 0.35 },
        { title: 'Review and test yourself', ratio: 0.25 }
      ],
      [
        { title: 'Skim syllabus and key topics', ratio: 0.15 },
        { title: 'Deep-dive into difficult sections', ratio: 0.35 },
        { title: 'Solve practice questions', ratio: 0.3 },
        { title: 'Recap and self-quiz', ratio: 0.2 }
      ]
    ],
    exam: [
      [
        { title: 'Review lecture notes', ratio: 0.2 },
        { title: 'Review key concepts and definitions', ratio: 0.15 },
        { title: 'Practice with past papers/questions', ratio: 0.35 },
        { title: 'Create cheat sheet/summary', ratio: 0.15 },
        { title: 'Final review and rest', ratio: 0.15 }
      ],
      [
        { title: 'List exam topics and weak areas', ratio: 0.15 },
        { title: 'Revise theory blocks', ratio: 0.25 },
        { title: 'Timed mock test session', ratio: 0.35 },
        { title: 'Error analysis and revision', ratio: 0.15 },
        { title: 'Quick recap before exam', ratio: 0.1 }
      ]
    ],
    project: [
      [
        { title: 'Define scope and requirements', ratio: 0.15 },
        { title: 'Research and gather resources', ratio: 0.2 },
        { title: 'Create outline/plan', ratio: 0.1 },
        { title: 'Execute main work', ratio: 0.4 },
        { title: 'Review and refine', ratio: 0.15 }
      ],
      [
        { title: 'Clarify project goals', ratio: 0.1 },
        { title: 'Break work into milestones', ratio: 0.2 },
        { title: 'Build core deliverables', ratio: 0.45 },
        { title: 'Validate against requirements', ratio: 0.15 },
        { title: 'Polish and finalize', ratio: 0.1 }
      ]
    ],
    report: [
      [
        { title: 'Research and gather information', ratio: 0.25 },
        { title: 'Create outline', ratio: 0.1 },
        { title: 'Write first draft', ratio: 0.35 },
        { title: 'Edit and proofread', ratio: 0.2 },
        { title: 'Format and finalize', ratio: 0.1 }
      ],
      [
        { title: 'Collect references and data', ratio: 0.2 },
        { title: 'Draft section structure', ratio: 0.15 },
        { title: 'Write core sections', ratio: 0.35 },
        { title: 'Add visuals and citations', ratio: 0.15 },
        { title: 'Final edit and formatting', ratio: 0.15 }
      ]
    ],
    default: [
      [
        { title: 'Plan and prepare', ratio: 0.15 },
        { title: 'Main work - Part 1', ratio: 0.35 },
        { title: 'Main work - Part 2', ratio: 0.35 },
        { title: 'Review and complete', ratio: 0.15 }
      ],
      [
        { title: 'Define objective and checklist', ratio: 0.15 },
        { title: 'Start implementation', ratio: 0.3 },
        { title: 'Continue and verify progress', ratio: 0.35 },
        { title: 'Finalize and close out', ratio: 0.2 }
      ]
    ]
  };

  // Determine which pattern to use
  let template = pickRandom(patterns.default);
  if (lowerTask.includes('exam') || lowerTask.includes('test')) {
    template = pickRandom(patterns.exam);
  } else if (lowerTask.includes('study') || lowerTask.includes('learn')) {
    template = pickRandom(patterns.study);
  } else if (lowerTask.includes('project')) {
    template = pickRandom(patterns.project);
  } else if (lowerTask.includes('report') || lowerTask.includes('essay') || lowerTask.includes('write')) {
    template = pickRandom(patterns.report);
  }

  const subtasks = rotateRandomly(template).map((item, index) => ({
    title: item.title,
    estimatedMinutes: Math.round(totalMinutes * item.ratio),
    order: index + 1
  }));

  return {
    success: true,
    mainTask: taskDescription,
    subtasks,
    totalEstimatedMinutes: totalMinutes,
    suggestions: 'This is an automated breakdown. Feel free to adjust the subtasks and time estimates based on your needs.',
    isAutoGenerated: true
  };
}

module.exports = {
  breakdownTask
};
