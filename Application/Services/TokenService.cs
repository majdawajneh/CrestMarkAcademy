using Application.Services.Interfaces;
using Domain.Entities.Identity;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

namespace Application.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;

        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public (string Token, DateTime ExpiresAt) GenerateAccessToken(User user,List<string> roles)
        {

            var jwtKey = _configuration["JWT:Key"]?? throw new InvalidOperationException("JWT Key is missing.");

            var issuer =_configuration["JWT:Issuer"];

            var audience =_configuration["JWT:Audience"];

            int expirationMinutes = int.TryParse(
                    _configuration["JWT:AccessTokenExpirationMinutes"],
                    out int minutes)
                    ? minutes
                    : 30;


            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier,user.Id.ToString()),

                new Claim(ClaimTypes.Name, user.Username),

                new Claim(ClaimTypes.Email,user.Email)
            };


            foreach (var role in roles)
            {
                claims.Add(
                    new Claim(
                        ClaimTypes.Role,
                        role
                    )
                );
            }


            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));


            var credentials = new SigningCredentials(key,SecurityAlgorithms.HmacSha256);


            var expiresAt =
                DateTime.UtcNow.AddMinutes(
                    expirationMinutes
                );


            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials
            );


            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return (tokenString, expiresAt);
        }

        public string GenerateRefreshToken()
        {
            var randomBytes = RandomNumberGenerator.GetBytes(64);
            return Convert.ToBase64String(randomBytes);
        }

        public string GenerateVerificationToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);

            return Convert.ToHexString(bytes);
        }

        public string HashToken(string token)
        {
            var tokenBytes = Encoding.UTF8.GetBytes(token);

            var hashBytes = SHA256.HashData(tokenBytes);

            return Convert.ToHexString(hashBytes);
        }
    }
}
