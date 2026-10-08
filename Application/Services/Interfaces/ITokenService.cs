using Domain.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface ITokenService
    {

        (string Token, DateTime ExpiresAt) GenerateAccessToken(
            User user,
            List<string> roles);

        string GenerateRefreshToken();

        string GenerateVerificationToken();

        string HashToken(string token);
    }
}

