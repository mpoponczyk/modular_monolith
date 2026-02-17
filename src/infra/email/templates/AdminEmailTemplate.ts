
// mateusz poponczyk

export const getAdminEmailTemplate = (content: string, title: string = 'Notification', headerImageSrc: string = '') => {
    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${title}</title>
    <style type="text/css">
        body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        table { border-collapse: collapse; }
        h1, h2, h3 { color: #333333; margin-top: 0; }
        p { color: #51545E; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
        .code-block { background-color: #f3f4f6; padding: 20px; text-align: center; font-family: monospace; font-size: 24px; letter-spacing: 5px; color: #4f46e5; border-radius: 8px; margin: 20px 0; font-weight: bold; border: 1px solid #e5e7eb; }
        .warning-text { color: #dc2626; background-color: #fef2f2; padding: 15px; border-radius: 5px; font-size: 14px; margin-top: 20px; border-left: 4px solid #dc2626; }
        .footer { font-size: 12px; color: #6b7280; text-align: center; padding-top: 20px; }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f7; padding: 20px 0;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; max-width: 600px; width: 100%; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-radius: 8px; overflow: hidden; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    
                    <!-- CSS Header -->
                    <tr>
                        <td align="left" style="padding: 30px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #ffffff;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <!-- Simple "Cubes" Logo made of divs -->
                                    <td valign="middle" style="padding-right: 15px;">
                                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; width: 24px; height: 24px;">
                                            <div style="width: 10px; height: 10px; background-color: #4f46e5; border-radius: 2px;"></div>
                                            <div style="width: 10px; height: 10px; background-color: #818cf8; border-radius: 2px;"></div>
                                            <div style="width: 10px; height: 10px; background-color: #6366f1; border-radius: 2px;"></div>
                                            <div style="width: 10px; height: 10px; background-color: #4338ca; border-radius: 2px;"></div>
                                        </div>
                                    </td>
                                    <!-- Title -->
                                    <td valign="middle">
                                        <span style="font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">modMonolith</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td align="left" style="padding: 40px 30px;">
                            ${content}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                &copy; ${new Date().getFullYear()} Mateusz Popończyk. All rights reserved.
                            </p>
                            <p style="margin: 5px 0 0; font-size: 12px; color: #9ca3af;">
                                Secure Automated System
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};
