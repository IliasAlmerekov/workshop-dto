<?php

declare(strict_types=1);

namespace App\Entity;

/**
 * The internal user model (spec section 5.1). This is deliberately not a
 * Doctrine entity — the workshop API has no database — but it plays the
 * entity's role in the story: it carries more than the public contract
 * should expose, which the entity endpoint (App\Controller\DemoUserController)
 * leaks on purpose.
 */
final readonly class User
{
    public function __construct(
        public int $id,
        public string $userName,
        public string $firstName,
        public string $lastName,
        public \DateTimeImmutable $birthDate,
        public string $email,
        public string $passwordHash,
        public string $internalNote,
        public \DateTimeImmutable $createdAt,
    ) {
    }
}
