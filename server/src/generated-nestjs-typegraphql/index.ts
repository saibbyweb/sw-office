import { Field } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { Int } from '@nestjs/graphql';
import { registerEnumType } from '@nestjs/graphql';
import { ID } from '@nestjs/graphql';

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

export enum UserScalarFieldEnum {
    id = "id",
    email = "email",
    password = "password",
    name = "name",
    role = "role",
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
    isCustom = "isCustom",
    userId = "userId",
    createdAt = "createdAt",
    updatedAt = "updatedAt"
}

export enum SortOrder {
    asc = "asc",
    desc = "desc"
}

export enum QueryMode {
    'default' = "default",
    insensitive = "insensitive"
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
registerEnumType(QueryMode, { name: 'QueryMode', description: undefined })
registerEnumType(SortOrder, { name: 'SortOrder', description: undefined })
registerEnumType(ProjectScalarFieldEnum, { name: 'ProjectScalarFieldEnum', description: undefined })
registerEnumType(SegmentScalarFieldEnum, { name: 'SegmentScalarFieldEnum', description: undefined })
registerEnumType(SessionScalarFieldEnum, { name: 'SessionScalarFieldEnum', description: undefined })
registerEnumType(UserScalarFieldEnum, { name: 'UserScalarFieldEnum', description: undefined })
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
    @Field(() => String, {nullable:false})
    type!: string;
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
export class ProjectCount {
    @Field(() => Int, {nullable:false})
    sessions?: number;
    @Field(() => Int, {nullable:false})
    workLogs?: number;
    @Field(() => Int, {nullable:false})
    segments?: number;
}

@ObjectType()
export class Project {
    @Field(() => ID, {nullable:false})
    id!: string;
    @Field(() => String, {nullable:false})
    name!: string;
    @Field(() => Boolean, {defaultValue:false,nullable:false})
    isCustom!: boolean;
    @Field(() => String, {nullable:false})
    userId!: string;
    @Field(() => Date, {nullable:false})
    createdAt!: Date;
    @Field(() => Date, {nullable:false})
    updatedAt!: Date;
    @Field(() => User, {nullable:false})
    user?: InstanceType<typeof User>;
    @Field(() => [Session], {nullable:true})
    sessions?: Array<Session>;
    @Field(() => [WorkLog], {nullable:true})
    workLogs?: Array<WorkLog>;
    @Field(() => [Segment], {nullable:true})
    segments?: Array<Segment>;
    @Field(() => ProjectCount, {nullable:false})
    _count?: InstanceType<typeof ProjectCount>;
}

@ObjectType()
export class Segment {
    @Field(() => ID, {nullable:false})
    id!: string;
    @Field(() => String, {nullable:false})
    sessionId!: string;
    @Field(() => String, {nullable:false})
    type!: string;
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
    @Field(() => String, {defaultValue:'ACTIVE',nullable:false})
    status!: string;
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
    @Field(() => SessionCount, {nullable:false})
    _count?: InstanceType<typeof SessionCount>;
}

@ObjectType()
export class UserCount {
    @Field(() => Int, {nullable:false})
    sessions?: number;
    @Field(() => Int, {nullable:false})
    breaks?: number;
    @Field(() => Int, {nullable:false})
    projects?: number;
    @Field(() => Int, {nullable:false})
    workLogs?: number;
}

@ObjectType()
export class User {
    @Field(() => ID, {nullable:false})
    id!: string;
    @Field(() => String, {nullable:false})
    email!: string;
    @Field(() => String, {nullable:false})
    password!: string;
    @Field(() => String, {nullable:false})
    name!: string;
    @Field(() => String, {defaultValue:'USER',nullable:false})
    role!: string;
    @Field(() => Date, {nullable:false})
    createdAt!: Date;
    @Field(() => Date, {nullable:false})
    updatedAt!: Date;
    @Field(() => [Session], {nullable:true})
    sessions?: Array<Session>;
    @Field(() => [Break], {nullable:true})
    breaks?: Array<Break>;
    @Field(() => [Project], {nullable:true})
    projects?: Array<Project>;
    @Field(() => [WorkLog], {nullable:true})
    workLogs?: Array<WorkLog>;
    @Field(() => UserCount, {nullable:false})
    _count?: InstanceType<typeof UserCount>;
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
