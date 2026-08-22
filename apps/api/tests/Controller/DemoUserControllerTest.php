<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Contract tests pinning both the intentional leak on the entity endpoint
 * and the safe shape of the DTO endpoint (spec section 5).
 */
final class DemoUserControllerTest extends WebTestCase
{
    public function testEntityEndpointLeaksInternalFieldsAndAnUnstableDateFormat(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/demo/users/7/entity');

        self::assertResponseIsSuccessful();
        $payload = json_decode((string) $client->getResponse()->getContent(), true, flags: \JSON_THROW_ON_ERROR);

        self::assertSame('ada.lovelace', $payload['userName']);
        self::assertSame('$argon2id$v=19$m=65536,t=4,p=1$c29tZXNhbHQ$ZGVtb29ubHlub3RyZWFs', $payload['passwordHash']);
        self::assertSame('VIP migration candidate', $payload['internalNote']);
        // The entity leaks a full timestamp, not the clean date the DTO exposes.
        self::assertSame('1815-12-10T00:00:00+00:00', $payload['birthDate']);
    }

    public function testDtoEndpointReturnsExactlyTheSafePublicContract(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/demo/users/7/dto');

        self::assertResponseIsSuccessful();

        self::assertJsonStringEqualsJsonString(
            json_encode([
                'id' => 7,
                'userName' => 'ada.lovelace',
                'displayName' => 'Ada Lovelace',
                'birthDate' => '1815-12-10',
                'email' => 'ada@example.test',
            ], \JSON_THROW_ON_ERROR),
            (string) $client->getResponse()->getContent(),
        );
    }

    public function testDtoEndpointNeverExposesPasswordHashOrInternalNote(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/demo/users/7/dto');

        $payload = json_decode((string) $client->getResponse()->getContent(), true, flags: \JSON_THROW_ON_ERROR);

        self::assertArrayNotHasKey('passwordHash', $payload);
        self::assertArrayNotHasKey('internalNote', $payload);
        self::assertArrayNotHasKey('createdAt', $payload);
    }

    public function testUnknownIdReturns404OnBothEndpoints(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/demo/users/999/entity');
        self::assertResponseStatusCodeSame(404);

        $client->request('GET', '/api/demo/users/999/dto');
        self::assertResponseStatusCodeSame(404);
    }
}
