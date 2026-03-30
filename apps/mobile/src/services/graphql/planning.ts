import { gql } from 'urql';

export const WEEKLY_QUEUE_QUERY = gql`
  query WeeklyQueue {
    weeklyQueue {
      apiaryId
      apiaryName
      tasks {
        id
        title
        hiveId
        hiveName
        priority
        dueDate
        status
        isOverdue
        catchUpGuidance
        requiredMaterials
        recommendedAction
      }
    }
  }
`;

export const HOMEPAGE_CONTEXT_QUERY = gql`
  query HomepageContext {
    homepageContext {
      weather {
        summary
        temperature
        conditions
        updatedAt
      }
      bloomStatus {
        phase
        description
        updatedAt
      }
      seasonalPhase {
        season
        weekInSeason
        riskSignals {
          type
          severity
          description
        }
      }
      regionalScaleWeight {
        averageDailyChange
        unit
        regionName
        updatedAt
      }
    }
  }
`;

export const COMPLETE_TASK_MUTATION = gql`
  mutation CompleteTask($id: UUID!) {
    completeTask(id: $id) {
      id
      status
      completedAt
    }
  }
`;

export const DEFER_TASK_MUTATION = gql`
  mutation DeferTask($id: UUID!, $reason: String, $newDueDate: DateTime!) {
    deferTask(id: $id, reason: $reason, newDueDate: $newDueDate) {
      id
      status
      dueDate
    }
  }
`;

export const DISMISS_TASK_MUTATION = gql`
  mutation DismissTask($id: UUID!, $reason: String) {
    dismissTask(id: $id, reason: $reason) {
      id
      status
    }
  }
`;

export const SEASONAL_CALENDAR_QUERY = gql`
  query SeasonalCalendar($region: String!) {
    seasonalCalendar(region: $region) {
      months {
        month
        year
        activities {
          title
          category
          urgency
        }
        riskWindows {
          type
          severity
        }
      }
    }
  }
`;
