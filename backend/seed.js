import { db, initDatabase } from "./db/database.js";
import { hashValue } from "./utils/auth.js";

await initDatabase();

const students = [
  { university_id: "TPU2026001", passport: "AA1111111", first_name: "Ali", last_name: "Valiyev" },
  { university_id: "TPU2026042", passport: "AB2222222", first_name: "Madina", last_name: "Karimova" },
  { university_id: "TPU2026099", passport: "AD1234567", first_name: "Jasur", last_name: "Rahmatov" }
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO authorized_students (university_id, passport_hash, first_name, last_name, active)
  VALUES (?, ?, ?, ?, 1)
`);

for (const s of students) {
  insert.run(s.university_id, hashValue(s.passport), s.first_name, s.last_name);
}

const count = db.prepare("SELECT count(*) as count FROM authorized_students").get().count;
console.log(`Database seeded successfully. Total authorized students in registry: ${count}`);
