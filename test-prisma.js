const { PrismaClient } = require('@prisma/client');
console.log('Import successful');
try {
    const prisma = new PrismaClient({
        datasourceUrl: "file:d:/SDG/sdg-registration/prisma/dev.db"
    });
    console.log('Instantiation successful');
} catch (e) {
    console.error(e);
}
