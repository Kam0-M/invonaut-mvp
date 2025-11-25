import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { CheckCircle2, XCircle, Database, Users, AlertCircle } from 'lucide-react'

export default async function TestPage() {
  let connectionStatus: 'success' | 'error' = 'success'
  let clientCount: number | null = null
  let errorMessage: string | null = null
  let supabaseUrl: string | null = null
  let connectionTime: number | null = null

  try {
    const startTime = Date.now()
    const supabase = await createClient()
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null
    
    // Test the connection by querying the clients table
    const { data, error, count } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    connectionTime = Date.now() - startTime

    if (error) {
      connectionStatus = 'error'
      errorMessage = error.message
    } else {
      clientCount = count ?? 0
    }
  } catch (error) {
    connectionStatus = 'error'
    if (error instanceof Error) {
      errorMessage = error.message
    } else {
      errorMessage = 'An unknown error occurred'
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Supabase Connection Test
          </h1>
          <p className="text-lg text-gray-600">
            Verify your database connection and configuration
          </p>
        </div>

        {/* Connection Status Card */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className={`w-6 h-6 ${
                  connectionStatus === 'success' ? 'text-primary' : 'text-destructive'
                }`} />
                <div>
                  <CardTitle className="text-xl">
                    Connection Status
                  </CardTitle>
                  <CardDescription>
                    {connectionStatus === 'success' 
                      ? 'Database connection established successfully'
                      : 'Failed to connect to database'
                    }
                  </CardDescription>
                </div>
              </div>
              {connectionStatus === 'success' ? (
                <div className="flex items-center space-x-2 text-primary">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-semibold">Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-destructive">
                  <XCircle className="w-6 h-6" />
                  <span className="font-semibold">Failed</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectionStatus === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-green-800 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">✅ Connected to Supabase successfully!</span>
                </div>
                <p className="text-sm text-green-700">
                  Your database connection is working correctly.
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-800 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Connection Failed</span>
                </div>
                <p className="text-sm text-red-700 mb-2">
                  {errorMessage || 'Unable to connect to the database.'}
                </p>
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-xs text-red-600 font-medium mb-1">Troubleshooting:</p>
                  <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                    <li>Check your environment variables in .env.local</li>
                    <li>Verify NEXT_PUBLIC_SUPABASE_URL is set correctly</li>
                    <li>Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is set correctly</li>
                    <li>Ensure your Supabase project is active</li>
                    <li>Check if the clients table exists in your database</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connection Details Card */}
        {connectionStatus === 'success' && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Connection Details</CardTitle>
                  <CardDescription>
                    Database query results and connection information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Number of Clients
                      </span>
                      <Users className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {clientCount ?? 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {clientCount === 0 
                        ? 'No clients found in database' 
                        : `${clientCount} client${clientCount === 1 ? '' : 's'} found`
                      }
                    </p>
                  </div>

                  {connectionTime !== null && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          Response Time
                        </span>
                        <Database className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-2xl font-bold text-secondary">
                        {connectionTime}ms
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Query execution time
                      </p>
                    </div>
                  )}
                </div>

                {supabaseUrl && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-primary">
                        Supabase URL
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-mono break-all">
                      {supabaseUrl}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  About This Test
                </p>
                <p className="text-sm text-gray-600">
                  This page tests your Supabase database connection by querying the{' '}
                  <code className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">
                    clients
                  </code>{' '}
                  table. If the table doesn't exist yet, you'll need to create it in your Supabase dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
