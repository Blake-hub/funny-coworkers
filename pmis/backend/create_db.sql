-- Create database and user for PMIS application
CREATE DATABASE pmis_db;
CREATE USER pmis_user WITH PASSWORD '123456';
GRANT ALL PRIVILEGES ON DATABASE pmis_db TO pmis_user;