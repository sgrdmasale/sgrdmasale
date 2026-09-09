import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Edit2, Save, X } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const PolicyPage = ({ policyType, title }) => {
  const { isAdmin } = useAuth();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPolicy();
  }, [policyType]);

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const result = await pb.collection('policies').getFirstListItem(`policyType="${policyType}"`, {
        $autoCancel: false
      });
      setPolicy(result);
      setEditContent(result.content || '');
    } catch (error) {
      console.error(`Failed to fetch ${policyType} policy:`, error);
      // Let it remain null to show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!policy) return;
    
    setSaving(true);
    try {
      const updated = await pb.collection('policies').update(policy.id, {
        content: editContent
      }, { $autoCancel: false });
      
      setPolicy(updated);
      setIsEditing(false);
      toast.success('Policy updated successfully');
    } catch (error) {
      console.error('Failed to update policy:', error);
      toast.error('Failed to update policy');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(policy?.content || '');
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{`${title} - SGRD Premium Spices`}</title>
        <meta name="description" content={`${title} for Harjinder Singh and Sons.`} />
      </Helmet>

      <Header />

      <main className="flex-grow py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">{title}</h1>
            {isAdmin && !isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="hidden sm:flex">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Policy
              </Button>
            )}
            {isAdmin && !isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="icon" className="sm:hidden">
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <Card className="shadow-sm border-border/50">
            <CardContent className="p-6 sm:p-10">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[90%]" />
                  <Skeleton className="h-4 w-[95%]" />
                  <Skeleton className="h-4 w-[80%]" />
                  <br />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[85%]" />
                </div>
              ) : !policy ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Policy content not found.</p>
                </div>
              ) : isEditing ? (
                <div className="space-y-6">
                  <div className="bg-primary/5 border border-primary/20 rounded-md p-4 mb-4 flex items-center text-sm text-primary">
                    <Edit2 className="w-4 h-4 mr-2" />
                    You are currently editing the {title}
                  </div>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[400px] text-base leading-relaxed"
                    placeholder="Enter policy content here..."
                  />
                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <Button variant="outline" onClick={handleCancel} disabled={saving}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80">
                  {policy.content.split('\n').map((paragraph, index) => {
                    // Simple parser: if line starts with #, make it a heading, else paragraph
                    if (paragraph.startsWith('### ')) {
                      return <h3 key={index} className="text-xl mt-8 mb-4">{paragraph.replace('### ', '')}</h3>;
                    } else if (paragraph.startsWith('## ')) {
                      return <h2 key={index} className="text-2xl mt-10 mb-5">{paragraph.replace('## ', '')}</h2>;
                    } else if (paragraph.startsWith('# ')) {
                      return <h1 key={index} className="text-3xl mt-12 mb-6">{paragraph.replace('# ', '')}</h1>;
                    } else if (paragraph.trim() === '') {
                      return <br key={index} />;
                    } else if (paragraph.startsWith('- ')) {
                      return (
                        <ul key={index} className="list-disc pl-5 my-2">
                          <li>{paragraph.replace('- ', '')}</li>
                        </ul>
                      );
                    }
                    return <p key={index} className="mb-4 text-muted-foreground leading-relaxed whitespace-pre-wrap">{paragraph}</p>;
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          
          {!loading && policy && !isEditing && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Last updated: {formatDate(policy.lastUpdated || policy.updated)}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PolicyPage;