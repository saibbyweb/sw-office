import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { Int } from '@nestjs/graphql';
import { registerEnumType } from '@nestjs/graphql';
import { ID } from '@nestjs/graphql';
import { Float } from '@nestjs/graphql';

export enum WorkLogScalarFieldEnum {
    id = "id",
    userId = "userId",
    sessionId = "sessionId",
    projectId = "projectId",
    content = "content",
    links = "links",
    createdAt = "createdAt",
    updatedAt = "updatedAt"
}

export enum WorkExceptionScalarFieldEnum {
    id = "id",
    userId = "userId",
    type = "type",
    date = "date",
    scheduledTime = "scheduledTime",
    actualTime = "actualTime",
    reason = "reason",
    notes = "notes",
    compensationDate = "compensationDate",
    createdAt = "createdAt",
    updatedAt = "updatedAt"
}

export enum UserScalarFieldEnum {
    id = "id",
    email = "email",
    name = "name",
    password = "password",
    role = "role",
    avatarUrl = "avatarUrl",
    isOnline = "isOnline",
    currentStatus = "currentStatus",
    slackUserId = "slackUserId",
    salaryINR = "salaryINR",
    archived = "archived",
    createdAt = "createdAt",
    updatedAt = "updatedAt"
}

export enum TaskScalarFieldEnum {
    id = "id",
    title = "title",
    description = "description",
    category = "category",
    priority = "priority",
    status = "status",
    points = "points",
    suggestedPoints = "suggestedPoints",
    estimatedHours = "estimatedHours",
    actualHours = "actualHours",
    suggestedById = "suggestedById",
    assignedToId = "assignedToId",
    approvedById = "approvedById",
    suggestedDate = "suggestedDate",
    approvedDate = "approvedDate",
    startedDate = "startedDate",
    completedDate = "completedDate",
    dueDate = "dueDate",
    completedSessionId = "completedSessionId",
    score = "score",
    prLinks = "prLinks",
    commitLinks = "commitLinks",
    screenshots = "screenshots",
    causedProductionBug = "causedProductionBug",
    productionBugPenalty = "productionBugPenalty",
    relatedBugTaskId = "relatedBugTaskId",
    rejectionReason = "rejectionReason",
    adminNotes = "adminNotes",
    projectId = "projectId",
    createdAt = "createdAt",
    updatedAt = "updatedAt"
}

export enum SessionScalarFieldEnum {
    id = "id",
    userId = "userId",
    startTime = "startTime",
    endTime = "endTime",
    totalDuration = "totalDuration",
    totalBreakTime = "totalBreakTime",
    status = "status",
    projectId = "projectId",
    createdAt = "createdAt",
    updatedAt = "updatedAt"
}

export enum SegmentScalarFieldEnum {
    id = "id",
    sessionId = "sessionId",
    type = "type",
    projectId = "projectId",
    breakId = "breakId",
    startTime = "startTime",
    endTime = "endTime",
    duration = "duration",
    createdAt = "createdAt",
    updatedAt = "updatedAt"
}

export enum ProjectScalarFieldEnum {
    id = "id",
    name = "name",
    slug = "slug",
    isActive = "isActive",
    createdAt = "createdAt",
    updatedAt = "updatedAt"
}

export enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN"
}

export enum TaskStatus {
    SUGGESTED = "SUGGESTED",
    APPROVED = "APPROVED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    PARTIALLY_COMPLETED = "PARTIALLY_COMPLETED",
    ABANDONED = "ABANDONED",
    REJECTED = "REJECTED",
    BLOCKED = "BLOCKED"
}

export enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}

export enum TaskCategory {
    MOBILE_APP = "MOBILE_APP",
    WEB_FRONTEND = "WEB_FRONTEND",
    BACKEND_API = "BACKEND_API",
    FULL_STACK = "FULL_STACK",
    BUG_FIX = "BUG_FIX",
    DEBUGGING = "DEBUGGING",
    CODE_REVIEW = "CODE_REVIEW",
    TESTING_QA = "TESTING_QA",
    DEVOPS = "DEVOPS",
    DOCUMENTATION = "DOCUMENTATION",
    CLIENT_COMMUNICATION = "CLIENT_COMMUNICATION",
    MENTORING = "MENTORING",
    RESEARCH = "RESEARCH",
    OFFICE_TASKS = "OFFICE_TASKS",
    MISCELLANEOUS = "MISCELLANEOUS"
}

export enum SortOrder {
    asc = "asc",
    desc = "desc"
}

export enum SessionStatus {
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    TERMINATED = "TERMINATED"
}

export enum SegmentType {
    WORK = "WORK",
    BREAK = "BREAK"
}

export enum QueryMode {
    'default' = "default",
    insensitive = "insensitive"
}

export enum ExceptionType {
    FULL_DAY_LEAVE = "FULL_DAY_LEAVE",
    HALF_DAY_LEAVE = "HALF_DAY_LEAVE",
    LATE_ARRIVAL = "LATE_ARRIVAL",
    EARLY_EXIT = "EARLY_EXIT",
    WORK_FROM_HOME = "WORK_FROM_HOME",
    SICK_LEAVE = "SICK_LEAVE",
    EMERGENCY_LEAVE = "EMERGENCY_LEAVE"
}

export enum BreakType {
    SHORT = "SHORT",
    LUNCH = "LUNCH",
    PRAYER = "PRAYER",
    OTHER = "OTHER"
}

export enum DailyOutputScoreScalarFieldEnum {
    id = "id",
    userId = "userId",
    date = "date",
    score = "score",
    tasksCompleted = "tasksCompleted",
    taskDifficulty = "taskDifficulty",
    initiativeCount = "initiativeCount",
    qualityRating = "qualityRating",
    availabilityRating = "availabilityRating",
    notes = "notes",
    assignedById = "assignedById",
    createdAt = "createdAt",
    updatedAt = "updatedAt"
}

export enum BreakScalarFieldEnum {
    id = "id",
    userId = "userId",
    sessionId = "sessionId",
    type = "type",
    startTime = "startTime",
    endTime = "endTime",
    duration = "duration",
    createdAt = "createdAt",
    updatedAt = "updatedAt"
}

registerEnumType(BreakScalarFieldEnum, { name: 'BreakScalarFieldEnum', description: undefined })
registerEnumType(DailyOutputScoreScalarFieldEnum, { name: 'DailyOutputScoreScalarFieldEnum', description: undefined })
registerEnumType(BreakType, { name: 'BreakType', description: undefined })
registerEnumType(ExceptionType, { name: 'ExceptionType', description: undefined })
registerEnumType(QueryMode, { name: 'QueryMode', description: undefined })
registerEnumType(SegmentType, { name: 'SegmentType', description: undefined })
registerEnumType(SessionStatus, { name: 'SessionStatus', description: undefined })
registerEnumType(SortOrder, { name: 'SortOrder', description: undefined })
registerEnumType(TaskCategory, { name: 'TaskCategory', description: undefined })
registerEnumType(TaskPriority, { name: 'TaskPriority', description: undefined })
registerEnumType(TaskStatus, { name: 'TaskStatus', description: undefined })
registerEnumType(UserRole, { name: 'UserRole', description: undefined })
registerEnumType(ProjectScalarFieldEnum, { name: 'ProjectScalarFieldEnum', description: undefined })
registerEnumType(SegmentScalarFieldEnum, { name: 'SegmentScalarFieldEnum', description: undefined })
registerEnumType(SessionScalarFieldEnum, { name: 'SessionScalarFieldEnum', description: undefined })
registerEnumType(TaskScalarFieldEnum, { name: 'TaskScalarFieldEnum', description: undefined })
registerEnumType(UserScalarFieldEnum, { name: 'UserScalarFieldEnum', description: undefined })
registerEnumType(WorkExceptionScalarFieldEnum, { name: 'WorkExceptionScalarFieldEnum', description: undefined })
registerEnumType(WorkLogScalarFieldEnum, { name: 'WorkLogScalarFieldEnum', description: undefined })

@ObjectType()
export class BreakCount {
    @Field(() => Int, {nullable:false})
    segments?: number;
}

@ObjectType()
export class Break {
    @Field(() => ID, {nullable:false})
    id!: string;
    @Field(() => String, {nullable:false})
    userId!: string;
    @Field(() => String, {nullable:false})
    sessionId!: string;
    @Field(() => BreakType, {nullable:false})
    type!: `${BreakType}`;
    @Field(() => Date, {nullable:false})
    startTime!: Date;
    @Field(() => Date, {nullable:true})
    endTime!: Date | null;
    @Field(() => Int, {defaultValue:0,nullable:false})
    duration!: number;
    @Field(() => Date, {nullable:false})
    createdAt!: Date;
    @Field(() => Date, {nullable:false})
    updatedAt!: Date;
    @Field(() => User, {nullable:false})
    user?: InstanceType<typeof User>;
    @Field(() => Session, {nullable:false})
    session?: InstanceType<typeof Session>;
    @Field(() => [Segment], {nullable:true})
    segments?: Array<Segment>;
    @Field(() => BreakCount, {nullable:false})
    _count?: InstanceType<typeof BreakCount>;
}

@ObjectType()
export class DailyOutputScore {
    @Field(() => ID, {nullable:false})
    id!: string;
    @Field(() => String, {nullable:false})
    userId!: string;
    @Field(() => Date, {nullable:false})
    date!: Date;
    @Field(() => Float, {nullable:false})
    score!: number;
    @Field(() => Int, {defaultValue:0,nullable:false})
    tasksCompleted!: number;
    @Field(() => Float, {nullable:true})
    taskDifficulty!: number | null;
    @Field(() => Int, {defaultValue:0,nullable:false})
    initiativeCount!: number;
    @Field(() => Float, {nullable:true})
    qualityRating!: number | null;
    @Field(() => Float, {nullable:true})
    availabilityRating!: number | null;
    @Field(() => String, {nullable:true})
    notes!: string | null;
    @Field(() => String, {nullable:true})
    assignedById!: string | null;
    @Field(() => Date, {nullable:false})
    createdAt!: Date;
    @Field(() => Date, {nullable:false})
    updatedAt!: Date;
    @Field(() => User, {nullable:false})
    user?: InstanceType<typeof User>;
    @Field(() => User, {nullable:true})
    assignedBy?: InstanceType<typeof User> | null;
}

@ObjectType()
export class ProjectCount {
    @Field(() => Int, {nullable:false})
    segments?: number;
    @Field(() => Int, {nullable:false})
    sessions?: number;
    @Field(() => Int, {nullable:false})
    workLogs?: number;
    @Field(() => Int, {nullable:false})
    tasks?: number;
}

@ObjectType()
export class Project {
    @Field(() => ID, {nullable:false})
    id!: string;
    @Field(() => String, {nullable:false})
    name!: string;
    @Field(() => String, {nullable:false})
    slug!: string;
    @Field(() => Boolean, {defaultValue:true,nullable:false})
    isActive!: boolean;
    @Field(() => Date, {nullable:false})
    createdAt!: Date;
    @Field(() => Date, {nullable:false})
    updatedAt!: Date;
    @Field(() => [Segment], {nullable:true})
    segments?: Array<Segment>;
    @Field(() => [Session], {nullable:true})
    sessions?: Array<Session>;
    @Field(() => [WorkLog], {nullable:true})
    workLogs?: Array<WorkLog>;
    @Field(() => [Task], {nullable:true})
    tasks?: Array<Task>;
    @Field(() => ProjectCount, {nullable:false})
    _count?: InstanceType<typeof ProjectCount>;
}

@ObjectType()
export class Segment {
    @Field(() => ID, {nullable:false})
    id!: string;
    @Field(() => String, {nullable:false})
    sessionId!: string;
    @Field(() => SegmentType, {nullable:false})
    type!: `${SegmentType}`;
    @Field(() => String, {nullable:true})
    projectId!: string | null;
    @Field(() => String, {nullable:true})
    breakId!: string | null;
    @Field(() => Date, {nullable:false})
    startTime!: Date;
    @Field(() => Date, {nullable:true})
    endTime!: Date | null;
    @Field(() => Int, {defaultValue:0,nullable:false})
    duration!: number;
    @Field(() => Date, {nullable:false})
    createdAt!: Date;
    @Field(() => Date, {nullable:false})
    updatedAt!: Date;
    @Field(() => Session, {nullable:false})
    session?: InstanceType<typeof Session>;
    @Field(() => Project, {nullable:true})
    project?: InstanceType<typeof Project> | null;
    @Field(() => Break, {nullable:true})
    break?: InstanceType<typeof Break> | null;
}

@ObjectType()
export class SessionCount {
    @Field(() => Int, {nullable:false})
    breaks?: number;
    @Field(() => Int, {nullable:false})
    workLogs?: number;
    @Field(() => Int, {nullable:false})
    segments?: number;
    @Field(() => Int, {nullable:false})
    completedTasks?: number;
}

@ObjectType()
export class Session {
    @Field(() => ID, {nullable:false})
    id!: string;
    @Field(() => String, {nullable:false})
    userId!: string;
    @Field(() => Date, {nullable:false})
    startTime!: Date;
    @Field(() => Date, {nullable:true})
    endTime!: Date | null;
    @Field(() => Int, {defaultValue:0,nullable:false})
    totalDuration!: number;
    @Field(() => Int, {defaultValue:0,nullable:false})
    totalBreakTime!: number;
    @Field(() => SessionStatus, {defaultValue:'ACTIVE',nullable:false})
    status!: `${SessionStatus}`;
    @Field(() => String, {nullable:true})
    projectId!: string | null;
    @Field(() => Date, {nullable:false})
    createdAt!: Date;
    @Field(() => Date, {nullable:false})
    updatedAt!: Date;
    @Field(() => User, {nullable:false})
    user?: InstanceType<typeof User>;
    @Field(() => Project, {nullable:true})
    project?: InstanceType<typeof Project> | null;
    @Field(() => [Break], {nullable:true})
    breaks?: Array<Break>;
    @Field(() => [WorkLog], {nullable:true})
    workLogs?: Array<WorkLog>;
    @Field(() => [Segment], {nullable:true})
    segments?: Array<Segment>;
    @Field(() => [Task], {nullable:true})
    completedTasks?: Array<Task>;
    @Field(() => SessionCount, {nullable:false})
    _count?: InstanceType<typeof SessionCount>;
}

@ObjectType()
export class Task {
    @Field(() => ID, {nullable:false})
    id!: string;
    @Field(() => String, {nullable:false})
    title!: string;
    @Field(() => String, {nullable:false})
    description!: string;
    @Field(() => TaskCategory, {nullable:false})
    category!: `${TaskCategory}`;
    @Field(() => TaskPriority, {defaultValue:'MEDIUM',nullable:false})
    priority!: `${TaskPriority}`;
    @Field(() => TaskStatus, {defaultValue:'SUGGESTED',nullable:false})
    status!: `${TaskStatus}`;
    @Field(() => Int, {nullable:false})
    points!: number;
    @Field(() => Int, {nullable:true})
    suggestedPoints!: number | null;
    @Field(() => Float, {nullable:false})
    estimatedHours!: number;
    @Field(() => Float, {nullable:true})
    actualHours!: number | null;
    @Field(() => String, {nullable:true})
    suggestedById!: string | null;
    @Field(() => String, {nullable:true})
    assignedToId!: string | null;
    @Field(() => String, {nullable:true})
    approvedById!: string | null;
    @Field(() => Date, {nullable:false})
    suggestedDate!: Date;
    @Field(() => Date, {nullable:true})
    approvedDate!: Date | null;
    @Field(() => Date, {nullable:true})
    startedDate!: Date | null;
    @Field(() => Date, {nullable:true})
    completedDate!: Date | null;
    @Field(() => Date, {nullable:true})
    dueDate!: Date | null;
    @Field(() => String, {nullable:true})
    completedSessionId!: string | null;
    @Field(() => Int, {nullable:true})
    score!: number | null;
    @Field(() => [String], {nullable:true})
    prLinks!: Array<string>;
    @Field(() => [String], {nullable:true})
    commitLinks!: Array<string>;
    @Field(() => [String], {nullable:true})
    screenshots!: Array<string>;
    @Field(() => Boolean, {defaultValue:false,nullable:false})
    causedProductionBug!: boolean;
    @Field(() => Int, {defaultValue:0,nullable:false})
    productionBugPenalty!: number;
    @Field(() => String, {nullable:true})
    relatedBugTaskId!: string | null;
    @Field(() => String, {nullable:true})
    rejectionReason!: string | null;
    @Field(() => String, {nullable:true})
    adminNotes!: string | null;
    @Field(() => String, {nullable:true})
    projectId!: string | null;
    @Field(() => Date, {nullable:false})
    createdAt!: Date;
    @Field(() => Date, {nullable:false})
    updatedAt!: Date;
    @Field(() => User, {nullable:true})
    suggestedBy?: InstanceType<typeof User> | null;
    @Field(() => User, {nullable:true})
    assignedTo?: InstanceType<typeof User> | null;
    @Field(() => User, {nullable:true})
    approvedBy?: InstanceType<typeof User> | null;
    @Field(() => Session, {nullable:true})
    completedSession?: InstanceType<typeof Session> | null;
    @Field(() => Project, {nullable:true})
    project?: InstanceType<typeof Project> | null;
}

@ObjectType()
export class UserCount {
    @Field(() => Int, {nullable:false})
    sessions?: number;
    @Field(() => Int, {nullable:false})
    breaks?: number;
    @Field(() => Int, {nullable:false})
    workLogs?: number;
    @Field(() => Int, {nullable:false})
    taskSuggestions?: number;
    @Field(() => Int, {nullable:false})
    taskAssignments?: number;
    @Field(() => Int, {nullable:false})
    taskApprovals?: number;
    @Field(() => Int, {nullable:false})
    workExceptions?: number;
    @Field(() => Int, {nullable:false})
    dailyOutputScores?: number;
    @Field(() => Int, {nullable:false})
    assignedScores?: number;
}

@ObjectType()
export class User {
    @Field(() => ID, {nullable:false})
    id!: string;
    @Field(() => String, {nullable:false})
    email!: string;
    @Field(() => String, {nullable:false})
    name!: string;
    @Field(() => String, {nullable:false})
    password!: string;
    @Field(() => UserRole, {defaultValue:'USER',nullable:false})
    role!: `${UserRole}`;
    @Field(() => String, {nullable:true})
    avatarUrl!: string | null;
    @Field(() => Boolean, {defaultValue:false,nullable:false})
    isOnline!: boolean;
    @Field(() => String, {nullable:true})
    currentStatus!: string | null;
    @Field(() => String, {nullable:true})
    slackUserId!: string | null;
    @Field(() => Int, {nullable:true})
    salaryINR!: number | null;
    @Field(() => Boolean, {defaultValue:false,nullable:false})
    archived!: boolean;
    @Field(() => Date, {nullable:false})
    createdAt!: Date;
    @Field(() => Date, {nullable:false})
    updatedAt!: Date;
    @Field(() => [Session], {nullable:true})
    sessions?: Array<Session>;
    @Field(() => [Break], {nullable:true})
    breaks?: Array<Break>;
    @Field(() => [WorkLog], {nullable:true})
    workLogs?: Array<WorkLog>;
    @Field(() => [Task], {nullable:true})
    taskSuggestions?: Array<Task>;
    @Field(() => [Task], {nullable:true})
    taskAssignments?: Array<Task>;
    @Field(() => [Task], {nullable:true})
    taskApprovals?: Array<Task>;
    @Field(() => [WorkException], {nullable:true})
    workExceptions?: Array<WorkException>;
    @Field(() => [DailyOutputScore], {nullable:true})
    dailyOutputScores?: Array<DailyOutputScore>;
    @Field(() => [DailyOutputScore], {nullable:true})
    assignedScores?: Array<DailyOutputScore>;
    @Field(() => UserCount, {nullable:false})
    _count?: InstanceType<typeof UserCount>;
}

@ObjectType()
export class WorkException {
    @Field(() => ID, {nullable:false})
    id!: string;
    @Field(() => String, {nullable:false})
    userId!: string;
    @Field(() => ExceptionType, {nullable:false})
    type!: `${ExceptionType}`;
    @Field(() => Date, {nullable:false})
    date!: Date;
    @Field(() => Date, {nullable:true})
    scheduledTime!: Date | null;
    @Field(() => Date, {nullable:true})
    actualTime!: Date | null;
    @Field(() => String, {nullable:true})
    reason!: string | null;
    @Field(() => String, {nullable:true})
    notes!: string | null;
    @Field(() => Date, {nullable:true})
    compensationDate!: Date | null;
    @Field(() => Date, {nullable:false})
    createdAt!: Date;
    @Field(() => Date, {nullable:false})
    updatedAt!: Date;
    @Field(() => User, {nullable:false})
    user?: InstanceType<typeof User>;
}

@ObjectType()
export class WorkLog {
    @Field(() => ID, {nullable:false})
    id!: string;
    @Field(() => String, {nullable:false})
    userId!: string;
    @Field(() => String, {nullable:false})
    sessionId!: string;
    @Field(() => String, {nullable:false})
    projectId!: string;
    @Field(() => String, {nullable:false})
    content!: string;
    @Field(() => [String], {nullable:true})
    links!: Array<string>;
    @Field(() => Date, {nullable:false})
    createdAt!: Date;
    @Field(() => Date, {nullable:false})
    updatedAt!: Date;
    @Field(() => User, {nullable:false})
    user?: InstanceType<typeof User>;
    @Field(() => Session, {nullable:false})
    session?: InstanceType<typeof Session>;
    @Field(() => Project, {nullable:false})
    project?: InstanceType<typeof Project>;
}
