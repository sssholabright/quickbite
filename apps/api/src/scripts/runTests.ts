import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runTests() {
    console.log('🧪 Running Delivery System Tests...\n');

    const tests = [
        {
            name: 'Redis Connection Test',
            command: 'npm run test:redis',
            description: 'Tests Redis connection and basic operations'
        },
        {
            name: 'Queue Service Test',
            command: 'node --loader ts-node/esm src/scripts/testQueues.ts',
            description: 'Tests BullMQ queue operations'
        },
        {
            name: 'Delivery Flow Test',
            command: 'node --loader ts-node/esm src/scripts/testDeliveryFlow.ts',
            description: 'Tests complete delivery orchestration flow'
        },
        {
            name: 'API Integration Tests',
            command: 'npm test -- --testPathPattern=delivery.test.ts',
            description: 'Tests API endpoints for delivery system'
        }
    ];

    for (const test of tests) {
        console.log(`\n�� Running: ${test.name}`);
        console.log(`📝 Description: ${test.description}`);
        console.log('─'.repeat(60));

        try {
            const { stdout, stderr } = await execAsync(test.command, {
                cwd: process.cwd(),
                timeout: 30000 // 30 second timeout
            });

            if (stdout) {
                console.log(stdout);
            }
            if (stderr) {
                console.log(stderr);
            }

            console.log(`✅ ${test.name} completed successfully\n`);

        } catch (error: any) {
            console.error(`❌ ${test.name} failed:`);
            console.error(error.message);
            console.log('─'.repeat(60));
        }
    }

    console.log('🎉 All tests completed!');
    process.exit(0);
}

// Run all tests
runTests();
