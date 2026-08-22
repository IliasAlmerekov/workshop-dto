<?php

declare(strict_types=1);

namespace App\Tests\Mapper;

use App\Entity\User;
use App\Mapper\UserResponseMapper;
use PHPUnit\Framework\TestCase;

final class UserResponseMapperTest extends TestCase
{
    public function testMapCombinesNamesFormatsDateAndDropsSensitiveFields(): void
    {
        $user = new User(
            id: 7,
            userName: 'ada.lovelace',
            firstName: 'Ada',
            lastName: 'Lovelace',
            birthDate: new \DateTimeImmutable('1815-12-10'),
            email: 'ada@example.test',
            passwordHash: '$argon2id$fake',
            internalNote: 'VIP migration candidate',
            createdAt: new \DateTimeImmutable('2024-01-01'),
        );

        $response = (new UserResponseMapper())->map($user);

        self::assertSame([
            'id' => 7,
            'userName' => 'ada.lovelace',
            'displayName' => 'Ada Lovelace',
            'birthDate' => '1815-12-10',
            'email' => 'ada@example.test',
        ], $response->toArray());
    }
}
