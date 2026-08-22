<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\UserSampleProvider;
use PHPUnit\Framework\TestCase;

final class UserSampleProviderTest extends TestCase
{
    public function testFindReturnsTheDeterministicSampleUser(): void
    {
        $provider = new UserSampleProvider();

        $user = $provider->find(7);

        self::assertNotNull($user);
        self::assertSame(7, $user->id);
        self::assertSame('ada.lovelace', $user->userName);
        self::assertSame('Ada', $user->firstName);
        self::assertSame('Lovelace', $user->lastName);
        self::assertSame('1815-12-10', $user->birthDate->format('Y-m-d'));
        self::assertSame('ada@example.test', $user->email);
    }

    public function testFindIsDeterministicAcrossCalls(): void
    {
        $provider = new UserSampleProvider();

        self::assertEquals($provider->find(7), $provider->find(7));
    }

    public function testFindReturnsNullForAnUnknownId(): void
    {
        $provider = new UserSampleProvider();

        self::assertNull($provider->find(999));
    }
}
