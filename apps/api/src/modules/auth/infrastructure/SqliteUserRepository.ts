import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import type { User } from "../domain/User.js";
import type { UserRepository } from "../domain/UserRepository.js";
import { PasswordService } from "./PasswordService.js";
import type { AdminLevel, UserRole } from "@portal-cvm/types";

interface UserRow {
  id: string;
  name: string;
  cpf: string;
  email: string;
  role: string;
  level: string;
  password_hash: string;
  salt: string;
  created_at: string;
}

/**
 * Repositório de usuários com persistência real em SQLite (utilizando DatabaseSync nativo do Node.js).
 * Cria automaticamente as tabelas e garante o seed inicial de administradores caso o banco esteja vazio.
 */
export class SqliteUserRepository implements UserRepository {
  private readonly db: DatabaseSync;
  private readonly dbPath: string;

  constructor(
    dbPath: string = path.resolve(process.cwd(), "data", "cvm_users.db"),
    passwordService: PasswordService = new PasswordService()
  ) {
    this.dbPath = dbPath;
    // Garante que o diretório de dados exista
    if (dbPath !== ":memory:") {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    this.db = new DatabaseSync(dbPath);
    this.initializeSchema();
    this.seedDefaultUsers(passwordService);
  }

  private initializeSchema(): void {
    if (this.dbPath !== ":memory:") {
      this.db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
    }
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        cpf TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        level TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
    `);
  }


  private seedDefaultUsers(passwordService: PasswordService): void {
    const countStmt = this.db.prepare("SELECT COUNT(*) as count FROM users");
    const result = countStmt.get() as { count: number | bigint };
    const count = Number(result?.count ?? 0);

    if (count === 0) {
      // 1. Usuário Administrador Master Padrão (CPF: 111.444.777-35)
      const adminPass = passwordService.hashPassword("Admin@123456");
      const adminUser: User = {
        id: "usr-admin-001",
        name: "Administrador CVM",
        cpf: "11144477735",
        email: "admin@cvm.gov.br",
        role: "ADMIN",
        level: "ADMIN_MASTER",
        passwordHash: adminPass.hash,
        salt: adminPass.salt,
        createdAt: "2025-01-01T00:00:00.000Z",
      };
      this.insertUser(adminUser);

      // 2. Usuário Analista Comum não-admin (para teste de bloqueio de acesso)
      const userPass = passwordService.hashPassword("User@123456");
      const regularUser: User = {
        id: "usr-regular-002",
        name: "Analista CVM (Não Admin)",
        cpf: "22255588846",
        email: "analista@cvm.gov.br",
        role: "USER",
        level: "ADMIN_ANALISTA",
        passwordHash: userPass.hash,
        salt: userPass.salt,
        createdAt: "2025-01-01T00:00:00.000Z",
      };
      this.insertUser(regularUser);
    }
  }

  private insertUser(user: User): void {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, name, cpf, email, role, level, password_hash, salt, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      user.id,
      user.name,
      user.cpf,
      user.email,
      user.role,
      user.level,
      user.passwordHash,
      user.salt,
      user.createdAt
    );
  }

  private mapRowToUser(row: UserRow): User {
    return {
      id: row.id,
      name: row.name,
      cpf: row.cpf,
      email: row.email,
      role: row.role as UserRole,
      level: row.level as AdminLevel,
      passwordHash: row.password_hash,
      salt: row.salt,
      createdAt: row.created_at,
    };
  }

  async findByCpf(cpf: string): Promise<User | null> {
    const stmt = this.db.prepare("SELECT * FROM users WHERE cpf = ?");
    const row = stmt.get(cpf) as UserRow | undefined;
    return row ? this.mapRowToUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const stmt = this.db.prepare("SELECT * FROM users WHERE id = ?");
    const row = stmt.get(id) as UserRow | undefined;
    return row ? this.mapRowToUser(row) : null;
  }

  async create(user: User): Promise<void> {
    this.insertUser(user);
  }

  async listAll(): Promise<User[]> {
    const stmt = this.db.prepare("SELECT * FROM users ORDER BY created_at DESC");
    const rows = stmt.all() as unknown as UserRow[];
    return rows.map((row) => this.mapRowToUser(row));
  }

  close(): void {
    this.db.close();
  }
}
