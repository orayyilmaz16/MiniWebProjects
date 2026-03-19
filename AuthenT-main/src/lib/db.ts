import { uid } from "./ids";
import { isoNow } from "./time";
import { hashPassword, verifyPassword,type PasswordDigest } from "./crypto";



// Not: Role zaten bu dosyada tanımlı, aşağıdaki Actor tipini ekliyoruz.

type Actor = { userId: string; role: Role };

function assertAdmin(actor: Actor) {
  if (actor.role !== "admin") throw new Error("Bu işlem için admin yetkisi gerekir.");
}

export type Role = "admin" | "user";

export type DbUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  password: PasswordDigest;
  createdAt: string;
};



export type DbComment = {
  id: string;
  postId: string;
  userId: string;
  userDisplayName: string;
  content: string;
  createdAt: string;
};

export type DbPost = {
  id: string;
  title: string;
  topic: string;
  content: string;
  image?: string; // dataURL veya URL
  createdAt: string;
  authorId: string;
  authorName: string;
  likedBy: string[]; // userId listesi
  comments: DbComment[];
};

type DbState = {
  users: DbUser[];
  posts: DbPost[];
};

const KEY = "authent_db_v1";

function read(): DbState | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  return JSON.parse(raw) as DbState;
}
function write(state: DbState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export async function initDb() {
  const current = read();
  if (current) return;

  const adminPass = await hashPassword("Admin123!");
  const userPass = await hashPassword("User123!");

  const admin: DbUser = {
    id: uid("u"),
    email: "admin@authent.dev",
    displayName: "AuthenT Admin",
    role: "admin",
    password: adminPass,
    createdAt: isoNow(),
  };
  const user: DbUser = {
    id: uid("u"),
    email: "user@authent.dev",
    displayName: "Demo User",
    role: "user",
    password: userPass,
    createdAt: isoNow(),
  };

  const demoPost: DbPost = {
    id: uid("p"),
    title: "AuthenT’e Hoş Geldin",
    topic: "Duyuru",
    content:
      "Bu bir demo yazısıdır. Admin panelinden yeni yazı ekleyebilir, kullanıcı olarak beğenebilir ve yorum yapabilirsin.",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80",
    createdAt: isoNow(),
    authorId: admin.id,
    authorName: admin.displayName,
    likedBy: [],
    comments: [],
  };

  write({ users: [admin, user], posts: [demoPost] });
}

export async function registerUser(input: { email: string; displayName: string; password: string }) {
  const state = read()!;
  const exists = state.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase());
  if (exists) throw new Error("Bu email zaten kayıtlı.");

  const digest = await hashPassword(input.password);
  const newUser: DbUser = {
    id: uid("u"),
    email: input.email,
    displayName: input.displayName,
    role: "user",
    password: digest,
    createdAt: isoNow(),
  };
  state.users.unshift(newUser);
  write(state);
  return sanitizeUser(newUser);
}

export async function login(input: { email: string; password: string }) {
  const state = read()!;
  const user = state.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
  if (!user) throw new Error("Kullanıcı bulunamadı.");

  const ok = await verifyPassword(input.password, user.password);
  if (!ok) throw new Error("Şifre hatalı.");

  return sanitizeUser(user);
}

export function getPosts() {
  const state = read()!;
  return [...state.posts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getPost(id: string) {
  const state = read()!;
  return state.posts.find((p) => p.id === id) ?? null;
}


export function toggleLike(postId: string, userId: string) {
  const state = read()!;
  const post = state.posts.find((p) => p.id === postId);
  if (!post) throw new Error("Post bulunamadı.");

  const idx = post.likedBy.indexOf(userId);
  if (idx >= 0) post.likedBy.splice(idx, 1);
  else post.likedBy.unshift(userId);

  write(state);
  return post;
}

export function addComment(postId: string, input: { userId: string; userDisplayName: string; content: string }) {
  const state = read()!;
  const post = state.posts.find((p) => p.id === postId);
  if (!post) throw new Error("Post bulunamadı.");

  const c: DbComment = {
    id: uid("c"),
    postId,
    userId: input.userId,
    userDisplayName: input.userDisplayName,
    content: input.content,
    createdAt: isoNow(),
  };
  post.comments.unshift(c);
  write(state);
  return post;
}

export async function changePassword(userId: string, oldPass: string, newPass: string) {
  const state = read()!;
  const user = state.users.find((u) => u.id === userId);
  if (!user) throw new Error("Kullanıcı bulunamadı.");

  const ok = await verifyPassword(oldPass, user.password);
  if (!ok) throw new Error("Mevcut şifre hatalı.");

  user.password = await hashPassword(newPass);
  write(state);
}

export function updateProfile(userId: string, displayName: string) {
  const state = read()!;
  const user = state.users.find((u) => u.id === userId);
  if (!user) throw new Error("Kullanıcı bulunamadı.");
  user.displayName = displayName;
  write(state);
  return sanitizeUser(user);
}

// src/lib/db.ts
export type SessionUser = {
  id: string;
  email: string;
  role: "admin" | "user";
  name?: string;
};


function sanitizeUser(u: DbUser): SessionUser {
  // password alanını saklamıyoruz
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = u;
  return rest;
}

export function createPost(
  input: {
    title: string;
    topic: string;
    content: string;
    image?: string;
    authorId: string;
    authorName: string;
  },
  actor?: Actor
) {
  if (actor) assertAdmin(actor);

  const state = read()!;
  const post: DbPost = {
    id: uid("p"),
    title: input.title,
    topic: input.topic,
    content: input.content,
    image: input.image,
    createdAt: isoNow(),
    authorId: input.authorId,
    authorName: input.authorName,
    likedBy: [],
    comments: [],
  };
  state.posts.unshift(post);
  write(state);
  return post;
}

export function updatePost(
  postId: string,
  input: { title: string; topic: string; content: string; image?: string },
  actor: Actor
) {
  assertAdmin(actor);

  const state = read()!;
  const post = state.posts.find((p) => p.id === postId);
  if (!post) throw new Error("Post bulunamadı.");

  post.title = input.title;
  post.topic = input.topic;
  post.content = input.content;
  post.image = input.image;

  write(state);
  return post;
}

export function deletePost(postId: string, actor?: Actor) {
  if (actor) assertAdmin(actor);

  const state = read()!;
  state.posts = state.posts.filter((p) => p.id !== postId);
  write(state);
}

export function deleteComment(postId: string, commentId: string, actor: Actor) {
  assertAdmin(actor);

  const state = read()!;
  const post = state.posts.find((p) => p.id === postId);
  if (!post) throw new Error("Post bulunamadı.");

  post.comments = post.comments.filter((c) => c.id !== commentId);
  write(state);
  return post;
}

