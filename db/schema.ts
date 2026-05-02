import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const cardColumnEnum = pgEnum("card_column", [
  "todo",
  "doing",
  "in_review",
  "done",
]);

export const cardTypeEnum = pgEnum("card_type", ["simple", "checklist"]);
export const projectTypeEnum = pgEnum("project_type", ["project", "quote"]);

const neonAuth = pgSchema("neon_auth");

export const neonAuthUsers = neonAuth.table("user", {
  id: uuid("id").primaryKey(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => neonAuthUsers.id, { onDelete: "cascade" }),
  type: projectTypeEnum("type").notNull().default("project"),
  isArchived: boolean("is_archived").notNull().default(false),
  name: text("name").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  description: text("description").notNull().default(""),
  totalValue: numeric("total_value", { precision: 12, scale: 2 }).notNull().default("0"),
  advanceValue: numeric("advance_value", { precision: 12, scale: 2 }).notNull().default("0"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index("projects_user_idx").on(table.userId),
  userArchivedIdx: index("projects_user_archived_idx").on(table.userId, table.isArchived),
  userCreatedIdx: index("projects_user_created_idx").on(table.userId, table.createdAt),
}));

export const cards = pgTable("cards", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  columnName: cardColumnEnum("column_name").notNull().default("todo"),
  type: cardTypeEnum("type").notNull().default("simple"),
  isCompleted: boolean("is_completed").notNull().default(false),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  projectIdx: index("cards_project_idx").on(table.projectId),
  projectColumnPositionIdx: index("cards_project_column_position_idx").on(
    table.projectId,
    table.columnName,
    table.position
  ),
}));

export const checklistItems = pgTable("checklist_items", {
  id: text("id").primaryKey(),
  cardId: text("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  cardIdx: index("checklist_items_card_idx").on(table.cardId),
  cardPositionIdx: index("checklist_items_card_position_idx").on(table.cardId, table.position),
}));
