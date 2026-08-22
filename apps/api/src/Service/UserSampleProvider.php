<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User;

/**
 * Deterministic stand-in for a database (spec section 5.1 and 9.1: the
 * workshop API needs no database and no persistence). Always returns the
 * same sample data for the same id.
 */
final class UserSampleProvider
{
    public function find(int $id): ?User
    {
        if (7 !== $id) {
            return null;
        }

        return new User(
            id: 7,
            userName: 'ada.lovelace',
            firstName: 'Ada',
            lastName: 'Lovelace',
            birthDate: new \DateTimeImmutable('1815-12-10'),
            email: 'ada@example.test',
            passwordHash: '$argon2id$v=19$m=65536,t=4,p=1$c29tZXNhbHQ$ZGVtb29ubHlub3RyZWFs',
            internalNote: 'VIP migration candidate',
            createdAt: new \DateTimeImmutable('2024-01-01T00:00:00+00:00'),
        );
    }
}
