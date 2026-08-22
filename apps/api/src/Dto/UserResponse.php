<?php

declare(strict_types=1);

namespace App\Dto;

/**
 * The safe public contract for a user (spec section 5.3). Only what a client
 * actually needs — no password hash, no internal note.
 */
final readonly class UserResponse
{
    public function __construct(
        public int $id,
        public string $userName,
        public string $displayName,
        public string $birthDate,
        public string $email,
    ) {
    }

    /**
     * @return array{id: int, userName: string, displayName: string, birthDate: string, email: string}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'userName' => $this->userName,
            'displayName' => $this->displayName,
            'birthDate' => $this->birthDate,
            'email' => $this->email,
        ];
    }
}
