<?php

declare(strict_types=1);

namespace App\Controller;

use App\Mapper\UserResponseMapper;
use App\Service\UserSampleProvider;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * The workshop's central teaching contrast (spec section 5): the same
 * internal User, served two ways.
 */
final class DemoUserController
{
    public function __construct(
        private readonly UserSampleProvider $users,
        private readonly UserResponseMapper $mapper,
    ) {
    }

    /**
     * Deliberately problematic: serializes the internal entity as-is,
     * leaking passwordHash and internalNote and exposing an unstable,
     * verbose date format (spec section 5.2).
     */
    #[Route('/api/demo/users/{id<\d+>}/entity', name: 'demo_user_entity', methods: ['GET'])]
    public function entity(int $id): JsonResponse
    {
        $user = $this->users->find($id);

        if (!$user) {
            return new JsonResponse(['error' => 'User not found'], 404);
        }

        return new JsonResponse([
            'id' => $user->id,
            'userName' => $user->userName,
            'firstName' => $user->firstName,
            'lastName' => $user->lastName,
            'birthDate' => $user->birthDate->format(\DATE_ATOM),
            'email' => $user->email,
            'passwordHash' => $user->passwordHash,
            'internalNote' => $user->internalNote,
            'createdAt' => $user->createdAt->format(\DATE_ATOM),
        ]);
    }

    /**
     * The safe counterpart: maps through UserResponseMapper and returns
     * exactly the public contract (spec section 5.3).
     */
    #[Route('/api/demo/users/{id<\d+>}/dto', name: 'demo_user_dto', methods: ['GET'])]
    public function dto(int $id): JsonResponse
    {
        $user = $this->users->find($id);

        if (!$user) {
            return new JsonResponse(['error' => 'User not found'], 404);
        }

        return new JsonResponse($this->mapper->map($user)->toArray());
    }
}
