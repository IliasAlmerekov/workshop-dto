<?php

declare(strict_types=1);

namespace App\Mapper;

use App\Dto\UserResponse;
use App\Entity\User;

/**
 * Maps the internal User onto the safe public UserResponse (spec section
 * 6.4): renames, combines first/last name into displayName, formats the
 * date, and — by simply not referencing them — drops passwordHash and
 * internalNote.
 */
final class UserResponseMapper
{
    public function map(User $user): UserResponse
    {
        return new UserResponse(
            id: $user->id,
            userName: $user->userName,
            displayName: trim("{$user->firstName} {$user->lastName}"),
            birthDate: $user->birthDate->format('Y-m-d'),
            email: $user->email,
        );
    }
}
