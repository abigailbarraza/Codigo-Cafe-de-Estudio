import sqlite3 from "sqlite3";
export function initDataBase(){
  const db = new sqlite3.Database("test.db");
}