
using Application.Dto_s.Certificate;
using Application.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.Globalization;
using System.IO;

namespace Application.Services
{
    public class CertificatePdfService : ICertificatePdfService
    {
        private const string Navy = "#17395E";
        private const string Gold = "#B49457";
        private const string Muted = "#718198";
        private const string Paper = "#FFFDFA";

        private readonly IHostEnvironment _environment;
        private readonly IConfiguration _configuration;

        // =====================================
        // Constructor
        // =====================================

        public CertificatePdfService(
            IHostEnvironment environment,
            IConfiguration configuration)
        {
            _environment = environment;
            _configuration = configuration;
        }

        // =====================================
        // Generate Certificate PDF
        // =====================================

        public byte[] GenerateCertificate(
            CertificateDetailsDto certificate)
        {
            ArgumentNullException.ThrowIfNull(certificate);

            // =====================================
            // Load Certificate Logo
            // =====================================

            var logoPath = Path.Combine(
                _environment.ContentRootPath,
                "Assets",
                "crestmark-logo-certificate.png"
            );

            if (!File.Exists(logoPath))
            {
                logoPath = Path.Combine(
                    AppContext.BaseDirectory,
                    "Assets",
                    "crestmark-logo-certificate.png"
                );
            }

            if (!File.Exists(logoPath))
            {
                throw new FileNotFoundException(
                    "Certificate logo was not found. " +
                    $"Expected location: {logoPath}",
                    logoPath
                );
            }

            var logoBytes = File.ReadAllBytes(logoPath);

            // =====================================
            // Generate Certificate Verification QR
            // =====================================

            var verificationUrl = BuildVerificationUrl(
                certificate.CertificateNumber
            );

            var qrCodeBytes = GenerateQrCode(
                verificationUrl
            );

            // =====================================
            // Generate PDF
            // =====================================

            return QuestPDF.Fluent.Document.Create(document =>
            {
                document.Page(page =>
                {
                    // =====================================
                    // Page Configuration
                    // =====================================

                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(14);
                    page.PageColor(Colors.White);

                    page.DefaultTextStyle(style =>
                        style
                            .FontFamily("Lato")
                            .FontSize(11)
                            .FontColor(Navy)
                    );

                    page.Content()
                        .Border(2)
                        .BorderColor(Navy)
                        .Background(Paper)
                        .Padding(8)
                        .Border(1)
                        .BorderColor(Gold)
                        .Padding(25)
                        .Column(column =>
                        {
                            column.Spacing(0);

                            // =====================================
                            // Logo
                            // =====================================

                            column.Item()
                                .Height(75)
                                .Row(row =>
                                {
                                    row.ConstantItem(255)
                                        .Height(75)
                                        .Image(logoBytes)
                                        .FitArea();

                                    row.RelativeItem();
                                });

                            // =====================================
                            // Certificate Heading
                            // =====================================

                            column.Item()
                                .PaddingTop(9)
                                .AlignCenter()
                                .Text(
                                    "OFFICIAL LEARNING ACHIEVEMENT"
                                )
                                .FontSize(9)
                                .Bold()
                                .FontColor(Gold);

                            column.Item()
                                .PaddingTop(7)
                                .AlignCenter()
                                .Text("Certificate of Completion")
                                .FontSize(33)
                                .FontFamily("Lato")
                                .FontColor(Navy);

                            column.Item()
                                .PaddingTop(13)
                                .AlignCenter()
                                .Width(70)
                                .LineHorizontal(1.5f)
                                .LineColor(Gold);

                            // =====================================
                            // Student Information
                            // =====================================

                            column.Item()
                                .PaddingTop(17)
                                .AlignCenter()
                                .Text(
                                    "THIS CERTIFICATE IS PROUDLY PRESENTED TO"
                                )
                                .FontSize(9)
                                .FontColor(Muted);

                            column.Item()
                                .PaddingTop(11)
                                .AlignCenter()
                                .Text(certificate.StudentName)
                                .FontSize(29)
                                .Bold()
                                .FontColor(Navy);

                            column.Item()
                                .PaddingTop(11)
                                .AlignCenter()
                                .Width(330)
                                .LineHorizontal(1)
                                .LineColor(Gold);

                            // =====================================
                            // Course Information
                            // =====================================

                            column.Item()
                                .PaddingTop(16)
                                .AlignCenter()
                                .Text(
                                    "FOR SUCCESSFULLY COMPLETING THE COURSE"
                                )
                                .FontSize(9)
                                .FontColor(Muted);

                            column.Item()
                                .PaddingTop(9)
                                .AlignCenter()
                                .Text(certificate.CourseTitle)
                                .FontSize(18)
                                .Bold()
                                .FontColor(Navy);

                            column.Item()
                                .PaddingTop(11)
                                .AlignCenter()
                                .Text("CRESTMARK ACADEMY")
                                .FontSize(9)
                                .Bold()
                                .FontColor(Gold);

                            // =====================================
                            // Certificate Details
                            // =====================================

                            column.Item()
                                .PaddingTop(23)
                                .LineHorizontal(1)
                                .LineColor("#DED2BD");

                            column.Item()
                                .PaddingTop(13)
                                .Row(row =>
                                {
                                    // Completion Date

                                    row.RelativeItem()
                                        .Column(item =>
                                        {
                                            item.Item()
                                                .Text(
                                                    "DATE OF COMPLETION"
                                                )
                                                .FontSize(8)
                                                .FontColor(Muted);

                                            item.Item()
                                                .PaddingTop(5)
                                                .Text(
                                                    FormatDate(
                                                        certificate.CourseCompletedAt
                                                    )
                                                )
                                                .FontSize(11)
                                                .Bold();
                                        });

                                    // Certificate Number

                                    row.RelativeItem(1.5f)
                                        .Column(item =>
                                        {
                                            item.Item()
                                                .AlignCenter()
                                                .Text("CERTIFICATE ID")
                                                .FontSize(8)
                                                .FontColor(Muted);

                                            item.Item()
                                                .PaddingTop(5)
                                                .AlignCenter()
                                                .Text(
                                                    certificate.CertificateNumber
                                                )
                                                .FontSize(11)
                                                .Bold();
                                        });

                                    // Issue Date

                                    row.RelativeItem()
                                        .Column(item =>
                                        {
                                            item.Item()
                                                .AlignRight()
                                                .Text("DATE OF ISSUE")
                                                .FontSize(8)
                                                .FontColor(Muted);

                                            item.Item()
                                                .PaddingTop(5)
                                                .AlignRight()
                                                .Text(
                                                    FormatDate(
                                                        certificate.IssuedAt
                                                    )
                                                )
                                                .FontSize(11)
                                                .Bold();
                                        });
                                });


                            // =====================================
                            // Footer + Certificate Verification QR
                            // =====================================

                            column.Item()
                                .PaddingTop(12)
                                .Row(row =>
                                {
                                    // Left side - Issuer

                                    row.RelativeItem()
                                        .Text("ISSUED BY CRESTMARK ACADEMY")
                                        .FontSize(7)
                                        .FontColor(Muted);

                                    // Right side - Academy + QR Code

                                    row.RelativeItem()
                                        .Column(right =>
                                        {
                                            right.Item()
                                                .AlignRight()
                                                .Text("CRESTMARK ACADEMY")
                                                .FontSize(7)
                                                .FontColor(Muted);

                                            right.Item()
                                                .PaddingTop(8)
                                                .AlignRight()
                                                .Width(76)
                                                .Height(76)
                                                .Image(qrCodeBytes)
                                                .FitArea();
                                        });
                                });
                        });
                });
            }).GeneratePdf();
        }


        // =====================================
        // Build Public Verification URL
        // =====================================

        private string BuildVerificationUrl(
            string certificateNumber)
        {
            if (string.IsNullOrWhiteSpace(certificateNumber))
            {
                throw new ArgumentException(
                    "Certificate number is required.",
                    nameof(certificateNumber)
                );
            }

            var baseUrl = _configuration[
                "CertificateVerification:BaseUrl"
            ];

            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                throw new InvalidOperationException(
                    "CertificateVerification:BaseUrl " +
                    "is not configured."
                );
            }

            baseUrl = baseUrl.Trim().TrimEnd('/');

            if (!Uri.TryCreate(
                    baseUrl,
                    UriKind.Absolute,
                    out var parsedBaseUrl
                ) ||
                (parsedBaseUrl.Scheme != Uri.UriSchemeHttp &&
                 parsedBaseUrl.Scheme != Uri.UriSchemeHttps))
            {
                throw new InvalidOperationException(
                    "CertificateVerification:BaseUrl " +
                    "must be a valid HTTP or HTTPS URL."
                );
            }

            var encodedNumber =
                Uri.EscapeDataString(certificateNumber);

            return
                $"{baseUrl}/en/verify-certificate" +
                $"?number={encodedNumber}";
        }

        // =====================================
        // Generate QR Code Image
        // =====================================


        private static byte[] GenerateQrCode(
            string verificationUrl)
        {
            using var qrData = QRCodeGenerator.GenerateQrCode(
                verificationUrl,
                QRCodeGenerator.ECCLevel.Q
            );

            var qrCode = new PngByteQRCode(qrData);

            return qrCode.GetGraphic(10);
        }


        // =====================================
        // Format Certificate Dates
        // =====================================

        private static string FormatDate(object? value)
        {
            return value switch
            {
                DateTime date =>
                    date.ToString(
                        "MMMM d, yyyy",
                        CultureInfo.InvariantCulture
                    ),

                DateTimeOffset date =>
                    date.ToString(
                        "MMMM d, yyyy",
                        CultureInfo.InvariantCulture
                    ),

                _ => "—"
            };
        }
    }
}
